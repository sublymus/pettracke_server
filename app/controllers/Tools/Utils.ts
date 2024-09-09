import { DatabaseQueryBuilderContract } from "@adonisjs/lucid/types/querybuilder";

export function paginate<T extends { page: number | undefined, limit: number | undefined }>(paginable: T): T & { page: number, limit: number } {
    let { page, limit } = paginable;

    if (page && page < 1) throw new Error(" page must be between [1 ,n] ");
    if (limit && limit < 1) throw new Error(" limit must be between [1 ,n] ");

    page = page ? Number(page) : 1;
    limit = limit ? Number(limit) : 25;

    return {
        ...paginable,
        limit,
        page
    }
}

export async function limitation(query: DatabaseQueryBuilderContract<any>, page: number, limit: number, order_by?: string) {
    const total = (await query).length
    limit = limit || 25
    limit = limit > 50 ? 50 : limit < 1 ? 1 : limit
    page = page || 1
    page = page < 1 ? 1 : page
    
    let pages = Math.max(Math.ceil(total / limit), 1);
    page = pages < page ? pages : page;
    
    query = query.limit(limit).offset((page - 1) * limit);

    order_by = order_by?.toLowerCase();
    if (order_by?.startsWith('name')) order_by = order_by.replace('name', 'title')
    if (order_by?.startsWith('popular')) order_by = order_by.replace('popular', 'title')

    if (order_by) {
        if (order_by == 'date_asc') query = query.orderBy("created_at", "asc");
        else if (order_by == 'date_desc') query = query.orderBy("created_at", "desc");
        else {
            const o = (order_by as string)
            const c = o.substring(0, o.lastIndexOf('_'));
            const m = o.substring(o.lastIndexOf('_') + 1, o.length) as any;
            query = query.orderBy(c, m);
        }
    } else {
        query = query.orderBy("created_at", "desc");
    }
    return {
        query,
        paging: {
            page,
            total,
            limit
        }
    };
}

export enum ERROR {
    PERMISION_REQUIRED,
    NOT_FOUND,
}

///home/opus/WorkSpace/Sublymus/sublymus_server/node_modules/.pnpm/@poppinss+matchit@3.1.2/node_modules/@poppinss/matchit/lib/matchit.js:25:49