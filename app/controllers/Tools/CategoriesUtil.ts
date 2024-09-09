import Category from "../../models/category.js";

const allCategories: any = {};

export async function allChildren(
  id: string | null,
  listId: string[],
  listModel?: any[],
  includes?: boolean
) {
  if (includes) {
    const cat = await Category.find(id);
    if (cat) {
      listId.push(cat.id);
      listModel?.push(cat.$attributes);
    }
  }

  let query = Category.query();
  if (id) query = query.where("parent_category_id", id);
  else query = query.whereNull("parent_category_id");
  const children = await query;

  for (const category of children) {
    if (!listId.includes(category.id)) {
      if (!allCategories[category.id])
        allCategories[category.id] = category.$attributes;
      listId.push(category.id);
      listModel?.push(category.$attributes);
      await allChildren(category.id, listId, listModel);
    }
  }
}

export async function parentList(id: string) {
  if (!id) return null;
  const categories: any[] = [];
  while (true) {
    const category = await Category.find(id);
    if (category) {
      categories.push(category.$attributes);
    //  id = category.parent_category_id;
    } else {
      break;
    }
  }
  return categories;
}
