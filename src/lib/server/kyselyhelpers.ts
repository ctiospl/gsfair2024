import type {
	Expression,
	RawBuilder,
	SelectQueryBuilder,
	Simplify,
	TableNode,
	SelectQueryNode,
	ArithmeticOperator,
	SelectionNode
} from 'kysely';
import {
	AliasNode,
	ColumnNode,
	IdentifierNode,
	ReferenceNode,
	ExpressionWrapper,
	ValueNode,
	expressionBuilder,
	isArithmeticOperator,
	isExpression,
	sql
} from 'kysely';

/**
 * A MariaDB helper for aggregating a subquery into a JSON array.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MariaDBDialect`.
 * While the produced SQL is compatibe with all MariaDB databases, some 3rd party dialects
 * may not parse the nested results into arrays.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonArrayFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .where('pet.owner_id', '=', 'person.id')
 *         .orderBy('pet.name')
 *     ).as('pets')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].pets[0].pet_id
 * result[0].pets[0].name
 * ```
 *
 * The generated SQL (MariaDB):
 *
 * ```sql
 * SELECT
 *     `id`,
 *     (
 *         SELECT
 *             COALESCE(
 *                 JSON_ARRAYAGG(
 *                     JSON_OBJECT('pet_id', `pet`.`id`, 'name', `pet`.`name`)
 *                 ),
 *                 '[]'
 *             ) AS `arg`
 *         FROM
 *             `pet`
 *         WHERE
 *             `pet`.`owner_id` = ?
 *         ORDER BY
 *             `pet`.`name`
 *     ) AS `pets`
 * FROM
 *     `person`
 * ```
 */

export function jsonArrayFrom<DB, TB extends keyof DB, O>(
	expr: SelectQueryBuilder<DB, TB, O>
): RawBuilder<O[]> {
	const selection = sql`coalesce(json_arrayagg(json_object(${sql.join(
		getMysqlJsonObjectArgs(expr.toOperationNode())
	)})), '[]') `;

	return sql<O[]>`${expr.clearSelect().select(selection.as('arg'))}`;
}

/**
 * A MariaDB helper for turning a subquery into a JSON object.
 *
 * The subquery must only return one row.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MariaDBDialect`.
 * While the produced SQL is compatibe with all MariaDB databases, some 3rd party dialects
 * may not parse the nested results into objects.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonObjectFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .where('pet.owner_id', '=', 'person.id')
 *         .where('pet.is_favorite', '=', true)
 *     ).as('favorite_pet')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].favorite_pet.pet_id
 * result[0].favorite_pet.name
 * ```
 *
 * The generated SQL (MariaDB):
 *
 * ```sql
 *  SELECT
 *      `id`,
 *      (
 *          SELECT
 *              JSON_OBJECT('pet_id', `pet`.`id`, 'name', `pet`.`name`) AS `arg`
 *          FROM
 *              `pet`
 *          WHERE
 *              `pet`.`owner_id` = ?
 *              AND `pet`.`is_favorite` = ?
 *      ) AS `favorite_pet`
 *  FROM
 *      `person`
 * ```
 */

export function jsonObjectFrom<DB, TB extends keyof DB, O>(
	expr: SelectQueryBuilder<DB, TB, O>
): RawBuilder<O[]> {
	const selection = sql`json_object(${sql.join(getMysqlJsonObjectArgs(expr.toOperationNode()))})`;

	return sql<O[]>`${expr.clearSelect().select(selection.as('arg'))}`;
}

/**
 * A MariaDB helper for aggregating a subquery into a JSON array.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MariaDBDialect`.
 * While the produced SQL is compatibe with all MariaDB databases, some 3rd party dialects
 * may not parse the nested results into arrays.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonArrayFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id as pet_id', 'pet.name'])
 *         .where('pet.owner_id', '=', 'person.id')
 *         .orderBy('pet.name')
 *     ).as('pets')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].pets[0].pet_id
 * result[0].pets[0].name
 * ```
 *
 * The generated SQL (MariaDB):
 *
 * ```sql
 * SELECT
 *     `id`,
 *     (
 *         SELECT
 *             COALESCE(
 *                 JSON_ARRAYAGG(
 *                     JSON_OBJECT('pet_id', `pet`.`id`, 'name', `pet`.`name`)
 *                 ),
 *                 '[]'
 *             ) AS `arg`
 *         FROM
 *             `pet`
 *         WHERE
 *             `pet`.`owner_id` = ?
 *         ORDER BY
 *             `pet`.`name`
 *     ) AS `pets`
 * FROM
 *     `person`
 * ```
 */

export function jsonArrayAgg<T>(expr: Expression<T>) {
	return sql<T[]>`json_arrayagg(${expr})`;
}

/**
 * The MariaDB `json_object` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MariaDBDialect`.
 * While the produced SQL is compatibe with all MariaDB databases, some 3rd party dialects
 * may not parse the nested results into objects.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     jsonBuildObject({
 *       first: eb.ref('first_name'),
 *       last: eb.ref('last_name'),
 *       full: eb.fn('concat', ['first_name', eb.val(' '), 'last_name'])
 *     }).as('name')
 *   ])
 *   .execute()
 *
 * result[0].id
 * result[0].name.first
 * result[0].name.last
 * result[0].name.full
 * ```
 *
 * The generated SQL (MariaDB):
 *
 * ```sql
 * select "id", json_object(
 *   'first', first_name,
 *   'last', last_name,
 *   'full', concat(`first_name`, ?, `last_name`)
 * ) as "name"
 * from "person"
 * ```
 */
export function jsonBuildObject<O extends Record<string, Expression<unknown>>>(
	obj: O
): RawBuilder<
	Simplify<{
		[K in keyof O]: O[K] extends Expression<infer V> ? V : never;
	}>
> {
	return sql`json_object(${sql.join(Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]]))})`;
}

/**
 * The MariaDB `json_array(json_object` function.
 *
 * NOTE: This helper is only guaranteed to fully work with the built-in `MariaDBDialect`.
 * While the produced SQL is compatibe with all MariaDB databases, some 3rd party dialects
 * may not parse the nested results into objects.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .selectFrom("person")
 *   .select((eb) => [
 *     "id",
 *     eb
 *       .selectFrom("pet")
 *       .whereRef("pet.owner_id", "=", "person.id")
 *       .select((eb) => [
 *         jsonBuildArrayObject({
 *           pet_id: eb.ref("pet.id"),
 *           name: eb.ref("pet.name"),
 *         }).as('arr_obj')
 *       ]).as("pets"),
 *   ])
 *   .execute();
 *
 * result[0].id
 * result[0].name.first
 * result[0].name.last
 * result[0].name.full
 * ```
 *
 * The generated SQL (MariaDB):
 *
 * ```sql
 * SELECT
 *    `id`,
 *    (
 *      SELECT
 *        JSON_ARRAYAGG(
 *          JSON_OBJECT('pet_id', `pet`.`id`, 'name', `pet`.`name`)
 *        ) AS `arr_obj`
 *      FROM
 *        `pet`
 *      WHERE
 *        `pet`.`owner_id` = `person`.`id`
 *    ) AS `pets`
 *  FROM
 *    `person`
 * ```
 */

export function jsonBuildArrayObject<O extends Record<string, Expression<unknown>>>(
	obj: O
): RawBuilder<
	Simplify<{
		[K in keyof O]: O[K] extends Expression<infer V> ? V : never;
	}>
> {
	return sql`json_arrayagg(json_object(${sql.join(
		Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]])
	)}))`;
}

export function jsonValue<O extends Record<string, Expression<unknown>>>(
	expr: string,
	path: string
): RawBuilder<O[]> {
	return sql<O[]>`json_value(${expr}, ${sql.lit(path)})`;
}

export function jsonExtract<O extends Record<string, Expression<unknown>>>(
	expr: string,
	path: string
): RawBuilder<O[]> {
	return sql<O[]>`json_extract(${expr}, ${sql.lit(path)})`;
}

function getJsonObjectArgs(node: SelectQueryNode) {
	const args = [];
	for (const { selection: s } of node.selections ?? []) {
		if (ReferenceNode.is(s) && ColumnNode.is(s.column)) {
			args.push(colName(s.column.column.name), colRef(s.table, s.column.column.name));
		} else if (ColumnNode.is(s)) {
			args.push(colName(s.column.name), s.column.name);
		} else if (AliasNode.is(s) && IdentifierNode.is(s.alias)) {
			args.push(colName(s.alias.name), new ExpressionWrapper(s.node));
		} else {
			throw new Error(`can't extract column names from the select query node`);
		}
	}
	return args;
}

function colName(col: string) {
	return new ExpressionWrapper(ValueNode.createImmediate(col));
}
function colRef(table: TableNode | undefined, col: string) {
	return new ExpressionWrapper(ReferenceNode.create(ColumnNode.create(col), table));
}

export function tuple<T1, T2>(e1: Expression<T1>, e2: Expression<T2>): Expression<[T1, T2]> {
	return sql<[T1, T2]>`(${e1}, ${e2})`;
}

export function jsonTable<O extends Record<string, Expression<unknown>>>(
	query: Expression<unknown> | string,
	depth: string,
	columns: Column[]
): RawBuilder<O[]> {
	if (typeof query === 'string') {
		return sql<O[]>`json_table(
            ${sql.id(query)},
            ${depth} COLUMNS(
                ${sql.raw(formatColumns(columns).join(', '))}
            )
        )`;
	}

	return sql<O[]>`json_table(
        (
            ${query}
        ),
        ${depth} COLUMNS(
            ${sql.raw(formatColumns(columns).join(', '))}
        )
    )`;
}
interface Column {
	colName: string;
	def: string;
	path: string;
}

function formatColumns(columns: Column[]) {
	return columns.map(({ colName, def, path }) => {
		return `${colName} ${def} path '${path}'`;
	});
}

function getMysqlJsonObjectArgs(node: SelectQueryNode) {
	try {
		return getJsonObjectArgs(node);
	} catch {
		throw new Error(
			'MySQL jsonArrayFrom and jsonObjectFrom functions can only handle explicit selections due to limitations of the json_object function. selectAll() is not allowed in the subquery.'
		);
	}
}

// export function formatDuplicateKeyParams(obj, ref) {
// 	return Object.keys(obj).reduce((acc, item) => {
// 		acc[item] = values(ref(item));
// 		return acc;
// 	}, {});
// }

// function values<T>(expr: Expression<T>) {
// 	return sql<T>`VALUES(${expr})`;
// }
export function formatDuplicateKeyParams<T extends object>(
	obj: T,
	ref: <K extends keyof T>(key: K) => Expression<T[K]>
): { [K in keyof T]: Expression<T[K]> } {
	return Object.keys(obj).reduce(
		(acc, key) => {
			const typedKey = key as keyof T;
			acc[typedKey] = values(ref(typedKey));
			return acc;
		},
		{} as { [K in keyof T]: Expression<T[K]> }
	);
}

// Define the type for the values function
function values<T>(expr: Expression<T>): Expression<T> {
	return sql<T>`VALUES(${expr})`;
}

export function mathOperation(
	arr: Array<Expression<unknown> | ArithmeticOperator>
): ExpressionWrapper<unknown, never, unknown> {
	const eb = expressionBuilder();
	if (arr.length < 3 || arr.length % 2 === 0) {
		throw new Error(
			'Minimum 3 arguments are required for the mathOperation function. Eg: mathOperation([eb.ref("pet.age"), "+", sql.lit(2), "*", eb.ref("owner.age"), "/", eb.ref("owner.pets")])'
		);
	}

	const [first, second, third, ...rest] = arr;

	if (!isExpression(first) || !isArithmeticOperator(second) || !isExpression(third)) {
		throw new Error('Invalid arguments types for mathOperation function');
	}

	if (rest.length === 0) {
		return eb(first, second, third);
	}

	return eb(first, second, mathOperation([third, ...rest]));
}

/*
export function mathOperation(arr: Array<Expression<unknown>| ArithmeticOperator>): Expression<unknown> {
	const eb = expressionBuilder();
	if (arr.length < 3 || arr.length % 2 === 0) {
		throw new Error(
			'Minimum 3 arguments are required for the mathOperation function. Eg: mathOperation([pet.age, "+", sql.lit(2), "*", owner.age, "/", owner.pets])'
		);
	}
    if(arr.slice(2).length === 1) {
        return eb(arr[0], arr[1], arr[2]);
    }
	return eb(arr[0], arr[1], mathOperation(arr.slice(2)));
}
*/
