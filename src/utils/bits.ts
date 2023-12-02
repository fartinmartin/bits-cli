import path from "path";
import fs from "fs";

import { prefix } from "../index";
import { extractConstants } from "./ts";

export async function getBitContent(bitRoot: string, bit: string) {
	if (!fs.existsSync(bitRoot)) throw Error(`No bit named '${bit}'`);

	const structure = await getStructure(bit);
	const wrapped = wrapInDiv(structure, bit);

	const parts = getParts(bitRoot, bit);
	const attrs = await getAttrs(bit, parts);

	const root = `\t.${prefix}${bit} {}\n`;
	const style = attrs.map((attr) => `\t.${prefix}${bit} :global(${attr}) {}\n`); // prettier-ignore

	return `${wrapped}\n\n<style>\n${root}\n${style.join("\n")}</style>`;
}

//

function wrapInDiv(structure: string, bit: string) {
	const scriptTagRegex = /<script[\s\S]+?<\/script>/;

	const match = structure.match(scriptTagRegex);
	if (!match) throw Error(`No \`<script>\` tag found in structure: ${bit}`);

	const scriptPart = match[0];
	const template = structure.replace(scriptTagRegex, "");

	const formatted = template.trim().split("\n").join("\n\t");
	const wrapped = `<div class="${prefix}${bit}">\n\t${formatted}\n</div>`;

	return `${scriptPart}\n\n${wrapped}`;
}

// attrs

async function getAttrs(bit: string, parts: string[]) {
	const dataAttrs = await getDataAttrs(bit);
	return parts.flatMap((part) => {
		const attr = `data-bits-${bit}-${part}`;
		const data = dataAttrs.get(part);

		if (data) {
			const extras = data.flatMap((d) => {
				if (d.name.includes("melt-")) {
					return [undefined];
				} else if (d.name === "value") {
					return [`[${attr}][data-${d.name}="%VALUE%"]`];
				} else if (!d.value || !d.value.length) {
					return [`[${attr}][data-${d.name}]`];
				} else if (d.value.includes("|")) {
					const values = d.value.split("|");
					const cleaned = values.map((v) => v.trim().replace(/'/g, ""));
					const attrs = cleaned.flatMap((v) => `[${attr}][data-${d.name}="${v}"]`); // prettier-ignore
					return unique(attrs);
				} else {
					return [`[${attr}][data-${d.name}="${d.value}"]`];
				}
			});

			return [`[${attr}]`, ...sift(extras)];
		} else {
			return [`[${attr}]`];
		}
	});
}

function getParts(bitRoot: string, bit: string) {
	const ctxPath = path.join(bitRoot, "ctx.js");
	if (!ctxPath) throw Error(`No context file found: ${bit}`);

	const data = fs.readFileSync(ctxPath, { encoding: "utf-8" });

	const partsRegex = /const\s+PARTS\s*=\s*(\[.*?\]);/s;
	const match = data.match(partsRegex);

	if (!match || !match[1])
		throw Error(`No \`PARTS\` found in 'ctx.js' file: ${bit}`);

	return JSON.parse(match[1]) as string[];
}

// parse github

async function getStructure(bit: string) {
	const markdown = await getMd(bit);
	const structureBlockRegex = /## Structure[\s\S]+?```svelte\n([\s\S]+?)```/;

	const match = markdown.match(structureBlockRegex);
	if (!match || !match[1])
		throw new Error(`Couldn't parse structure in markdown: ${bit}`);

	return match[1].trim();
}

async function getDataAttrs(bit: string) {
	const ts = await getApiRef(bit);
	return extractConstants(ts);
}

// github

async function getMd(bit: string) {
	const basePath = "main/content/components";
	const filePath = `${bit}.md`;
	return await fetchData(basePath, filePath);
}

async function getApiRef(bit: string) {
	const basePath = "main/src/content/api-reference";
	const filePath = `${bit}.ts`;
	return await fetchData(basePath, filePath);
}

async function fetchData(basePath: string, filePath: string) {
	const base = `https://raw.githubusercontent.com/huntabyte/bits-ui`;
	const url = `${base}/${basePath}/${filePath}`;

	const response = await fetch(url);

	if (!response.ok)
		throw new Error(`Failed to fetch file (${filePath}): ${response.statusText}`); // prettier-ignore

	return await response.text();
}

// radash

export const unique = <T, K extends string | number | symbol>(
	array: readonly T[],
	toKey?: (item: T) => K
): T[] => {
	const valueMap = array.reduce((acc, item) => {
		const key = toKey ? toKey(item) : (item as any as string | number | symbol);
		if (acc[key]) return acc;
		acc[key] = item;
		return acc;
	}, {} as Record<string | number | symbol, T>);
	return Object.values(valueMap);
};

type Falsy = null | undefined | false | "" | 0 | 0n;

export const sift = <T>(list: readonly (T | Falsy)[]): T[] => {
	return (list?.filter((x) => !!x) as T[]) ?? [];
};
