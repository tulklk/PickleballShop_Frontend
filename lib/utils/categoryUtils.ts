import type { CategoryTreeDto } from "@/lib/api/types";

/**
 * Tìm root category (category gốc không có parent) từ categoryId trong category tree
 * @param categoryId - ID của category cần tìm root
 * @param categoryTree - Cây danh mục từ API
 * @returns Root category name hoặc null nếu không tìm thấy
 */
export function findRootCategoryName(
  categoryId: string | undefined | null,
  categoryTree: CategoryTreeDto[] | undefined
): string | null {
  if (!categoryId || !categoryTree || categoryTree.length === 0) {
    return null;
  }

  // Helper function để tìm category trong tree
  const findCategoryInTree = (
    id: string,
    tree: CategoryTreeDto[]
  ): CategoryTreeDto | null => {
    for (const cat of tree) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryInTree(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Tìm category hiện tại
  const currentCategory = findCategoryInTree(categoryId, categoryTree);
  if (!currentCategory) {
    return null;
  }

  // Nếu category này không có parent trong tree (là root), return name
  // Nếu có parent, tìm tiếp lên root
  const findRoot = (cat: CategoryTreeDto | null): CategoryTreeDto | null => {
    if (!cat) return null;

    // Kiểm tra xem category này có parent trong tree không
    const hasParentInTree = categoryTree.some(
      (rootCat) =>
        rootCat.children?.some((child) => child.id === cat.id) ||
        (rootCat.children?.some((child) =>
          child.children?.some((grandchild) => grandchild.id === cat.id)
        ) &&
          rootCat.children?.find((child) =>
            child.children?.some((grandchild) => grandchild.id === cat.id)
          ))
    );

    // Nếu không có parent trong tree, đây là root
    if (!hasParentInTree) {
      return cat;
    }

    // Tìm parent trong tree
    for (const rootCat of categoryTree) {
      if (rootCat.children?.some((child) => child.id === cat.id)) {
        return findRoot(rootCat);
      }
      if (rootCat.children) {
        for (const child of rootCat.children) {
          if (child.children?.some((grandchild) => grandchild.id === cat.id)) {
            return findRoot(rootCat);
          }
        }
      }
    }

    return cat;
  };

  const rootCategory = findRoot(currentCategory);
  return rootCategory?.name || null;
}
