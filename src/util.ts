import { InternalPresentation } from "./normalizer";
import React from "react";
import ReactIs from "react-is";
import { isReactPPTXComponent } from "./nodes";

export const POINTS_TO_INCHES = 1 / 72;

export const layoutToInches = (
  layout: InternalPresentation["layout"]
): [number, number] => {
  switch (layout) {
    case "16x10":
      return [10, 6.25];
    case "16x9":
      return [10, 5.625];
    case "4x3":
      return [10, 7.5];
    case "wide":
      return [13.3, 7.5];
  }
};

export type ChildElement<P> = React.ReactElement<P> | ChildElement<P>[];

export function isReactElementOrElementArray<T>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  arr: {} | null | undefined
): arr is ChildElement<T> {
  return React.isValidElement(arr);
}

// Credits: https://github.com/grrowl/react-keyed-flatten-children
type PotentialChildren = Array<
  Exclude<React.ReactNode, boolean | null | undefined>
>;
export function flattenChildren(
  children: React.ReactNode,
  keys: (string | number)[] = []
): PotentialChildren {
  return React.Children.toArray(children).reduce(
    (acc: PotentialChildren, node, nodeIndex) => {
      if (ReactIs.isFragment(node)) {
        acc.push(
          ...flattenChildren(
            node.props.children,
            keys.concat(node.key || nodeIndex)
          )
        );
      } else {
        if (ReactIs.isElement(node)) {
          if (isReactPPTXComponent(node)) {
            acc.push(
              React.cloneElement(node, {
                key: keys.concat(String(node.key)).join("."),
              })
            );
          } else {
            // A component that could return/contain react-pptx components,
            // traverse the tree some more
            let children = node.props.children;
            if (node.type instanceof Function) {
              children = (node.type as React.FunctionComponent<any>)(
                node.props
              );
            }
            acc.push(
              ...flattenChildren(children, keys.concat(node.key || nodeIndex))
            );
          }
        } else if (typeof node === "string" || typeof node === "number") {
          acc.push(node);
        }
      }
      return acc;
    },
    []
  ) as PotentialChildren;
}
