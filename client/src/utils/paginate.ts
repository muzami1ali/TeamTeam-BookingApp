import _ from "lodash";

// This is a utility function that returns a subset of the items array
export function paginate(items:any[], pageNumber:number, pageSize:number) {
  const startIndex = (pageNumber - 1) * pageSize;
  return _(items).slice(startIndex).take(pageSize).value();
}
