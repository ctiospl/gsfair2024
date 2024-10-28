import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({url}) => {
    console.log('url :>> ', url);
    return new Response();
};
