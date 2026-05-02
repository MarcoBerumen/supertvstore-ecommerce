import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProductMedia } from "@/components/product-media";

// The hash + gradient functions inside <ProductMedia> aren't exported, so we
// test the observable contract: same seed -> same gradient stops, different
// seeds -> different gradient stops. The seed is derived from `name|category`.

function gradientStyles(container: HTMLElement): string[] {
  const layers = container.querySelectorAll<HTMLElement>(
    "[aria-hidden='true'][style*='linear-gradient']",
  );
  return Array.from(layers).map((el) => el.style.backgroundImage);
}

describe("<ProductMedia> placeholder gradient", () => {
  it("produces the same gradient stops for the same name+category", () => {
    const a = render(<ProductMedia name="LG C3 65" category="TV" />);
    const b = render(<ProductMedia name="LG C3 65" category="TV" />);
    expect(gradientStyles(a.container)).toEqual(gradientStyles(b.container));
  });

  it("produces different gradient stops for different names", () => {
    const a = render(<ProductMedia name="LG C3 65" category="TV" />);
    const b = render(<ProductMedia name="Sony A95L 77" category="TV" />);
    expect(gradientStyles(a.container)).not.toEqual(
      gradientStyles(b.container),
    );
  });

  it("renders both light and dark gradient layers", () => {
    const { container } = render(<ProductMedia name="Anything" />);
    expect(gradientStyles(container)).toHaveLength(2);
  });

  it("renders the name label when showLabel is true (default)", () => {
    const { getByText } = render(<ProductMedia name="LG C3 65" />);
    expect(getByText("LG C3 65")).toBeInTheDocument();
  });

  it("hides the name label when showLabel is false", () => {
    const { queryByText } = render(
      <ProductMedia name="LG C3 65" showLabel={false} />,
    );
    expect(queryByText("LG C3 65")).not.toBeInTheDocument();
  });
});
