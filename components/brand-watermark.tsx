import Image from "next/image";

/**
 * 背景装飾用のロゴ透かし。next/imageで最適化しつつ、
 * 低不透明度+ブラーで「主張しすぎない」背景テクスチャとして表示する。
 * 装飾目的のみのため alt="" + aria-hidden + pointer-events-none。
 * 配置(位置)は呼び出し側でclassNameのposition関連クラスを渡して調整する。
 */
export function BrandWatermark({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute h-[36rem] w-[36rem] opacity-[0.06] blur-3xl ${className}`}
    >
      <Image
        src="/images/HGRA.png"
        alt=""
        fill
        sizes="576px"
        className="object-contain"
      />
    </div>
  );
}
