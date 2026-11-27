import type { Plugin } from "vite";
export function apiPlugin(catalog: {id:string;name:string;price:number}[]): Plugin;
