import { Kysely, MysqlAdapter, MysqlDialect, ParseJSONResultsPlugin } from 'kysely';
import { MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USER, MYSQL_DB } from '$env/static/private';
import { Mysql2Adapter } from '@lucia-auth/adapter-mysql';

import type { Compilable, DialectAdapter, Explainable } from 'kysely';
import type { DB } from 'kysely-codegen';
import { createPool } from 'mysql2/promise';
import { format } from 'sql-formatter';
import { highlight } from 'sql-highlight';

class MariaDBDialect extends MysqlDialect {
	createAdapter(): DialectAdapter {
		return new MariaDBAdapter();
	}
}

class MariaDBAdapter extends MysqlAdapter {
	get supportsReturning(): boolean {
		return true;
	}
}

export const pool = createPool({
	host: MYSQL_HOST,
	user: MYSQL_USER,
	password: MYSQL_PASSWORD,
	database: MYSQL_DB,
	waitForConnections: true,
	queueLimit: 0,
	connectionLimit: 100,
	typeCast(field, next) {
		if (field.type === 'TINY' && field.length === 1) {
			return field.string() === '1';
		} else if (field.type === 'NEWDECIMAL') {
			const value = field.string();
			return value === null ? null : parseFloat(value);
		} else {
			return next();
		}
	}
});

const dialect = new MariaDBDialect({
	pool: pool.pool // IMPORTANT NOT TO JUST PASS `pool`
});

export const db = new Kysely<DB>({
	dialect,
	plugins: [new ParseJSONResultsPlugin()]
});

const tableNames = {
	user: 'users',
	session: 'user_session'
};
export const adapter = new Mysql2Adapter(pool, tableNames);

export function log<T extends Compilable>(qb: T): T {
	console.log(qb.compile());
	return qb;
}

export function sqlString<T extends Compilable>(qb: T): T {
	console.log(
		highlight(format(dangerouslyHydrateSQLParameters(qb.compile().sql, qb.compile().parameters)))
	);

	return qb;
}

// const dangerouslyHydrateSQLParameters = (sql: string, parameters: readonly unknown[]): string => {
// 	return parameters.reduce((acc: string, param) => {
// 		return param && typeof param === 'string'
// 			? acc.replace('?', `'${param.replace(/'/g, "''")}'`)
// 			: acc.replace('?', `${param}`);
// 	}, sql);
// };

const dangerouslyHydrateSQLParameters = (sql: string, parameters: readonly unknown[]): string => {
	let modifiedSql = sql;
	for (const parameter of parameters) {
		if (typeof parameter === 'string') {
			modifiedSql = modifiedSql.replace('?', `'${parameter.replace(/'/g, "''")}'`);
		} else {
			modifiedSql = modifiedSql.replace('?', `${parameter}`);
		}
	}

	return modifiedSql;
};
