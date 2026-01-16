import { atom } from "recoil";

const getInitialDesktopCat = (): boolean => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("desktopCatEnabled");
    if (stored === "true") return true;
  }
  return false;
};

const __global = globalThis as any;
__global.__recoilAtoms = __global.__recoilAtoms || {};

export const desktopCatState =
  __global.__recoilAtoms.desktopCatState ||
  (__global.__recoilAtoms.desktopCatState = atom<boolean>({
    key: "desktopCatState",
    default: getInitialDesktopCat(),
    effects: [
      ({ onSet }) => {
        if (typeof window === "undefined") return;
        onSet((val) => {
          try {
            localStorage.setItem("desktopCatEnabled", val ? "true" : "false");
          } catch (e) {}
        });
      },
    ],
  }));
