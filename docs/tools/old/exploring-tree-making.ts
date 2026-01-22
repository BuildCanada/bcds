const navTreeLeafSchema = z.record(z.string(), z.string());
const navTreeBranchSchema = z.record(z.string(), navTreeLeafSchema);

type NavTreeLeaf = Record<string, string>;
type NavTreeBranch = Record<string, NavTreeLeaf>;
type NavTreeNode = Record<string, NavTreeBranch | NavTreeLeaf | string>;

function checkNodeType(node: NavTreeNode): "leaf" | "branch" | "node" {
  const asLeaf = navTreeLeafSchema.safeParse(node);
  if (asLeaf.success) {
    return "leaf";
  }
  const asBranch = navTreeBranchSchema.safeParse(node);
  if (asBranch.success) {
    return "branch";
  }
  return "node";
}

function addLeafToLeaf(a: NavTreeLeaf, b: NavTreeNode): NavTreeNode {
  const leaves = { ...a };
  const tree = { ...b };
  console.log({ leaves, tree });
  return { ...b, ...a };
}

function addNavTreeLeaf(key: string, value: string, node: NavTreeNode) {
  const nodeType = checkNodeType(node);
  switch (nodeType) {
    case "leaf":
      return { ...node, [key]: value };
  }
}

function makeNavTree(items: string[]) {
  let nav_tree: NavTreeNode = {};
  for (const item of items) {
    const parts = item.split("/");
    console.log({ parts });
    parts.forEach((part, idx) => {
      console.log({ before: nav_tree });
      if (idx == 1) {
        nav_tree = { ...nav_tree, [parts[idx - 1]!]: part };
      }
      if (idx == 2) {
        let parent = nav_tree[parts[idx - 1]!]!;
        const stringParse = z.string().safeParse(parent);
        if (stringParse.success) {
          nav_tree = {
            ...nav_tree,
            [parts[idx - 2]!]: { [stringParse.data]: part },
          };
        }
        const recordParse = navTreeBranchSchema.safeParse(parent);
        if (recordParse.success) {
          nav_tree = {
            ...nav_tree,
            [parts[idx - 2]!]: { ...recordParse.data },
          };
        }
      }
      console.log({ after: nav_tree });
    });
  }
  console.dir({ nav_tree });
}
