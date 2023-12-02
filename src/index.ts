import path from "path";
import fs from "fs";
import { getBitContent } from "./utils";

// TODO: get prefix from args, for now:
export const prefix = ""; // "bits-"

main();

async function main() {
	// TODO: get bits list from args, for now:
	const bits = ["accordion", "alert-dialog", "aspect-ratio", "avatar", "button", "checkbox", "collapsible", "context-menu", "dialog", "dropdown-menu", "label", "link-preview", "menubar", "popover", "progress", "radio-group", "select", "separator", "slider", "switch", "tabs", "toggle", "toggle-group", "tooltip" ]; // prettier-ignore
	const root = process.cwd();

	const bitsPath = path.join("bits-ui", "dist", "bits");
	const bitsRoot = path.join(root, "node_modules", bitsPath);
	if (!fs.existsSync(bitsRoot))
		throw Error("`bits-cli` requires `bits-ui`: run `npm i bits-ui` and try again"); // prettier-ignore

	// TODO: get user's lib dir from args, for now:
	const libPath = path.join(root, "src", "lib", "bits");
	if (!fs.existsSync(libPath)) fs.mkdirSync(libPath, { recursive: true });

	for (const bit of bits) {
		try {
			// TODO: check if user already has bit, if they do, don't override, for now:
			const bitRoot = path.join(bitsRoot, bit);
			const content = await getBitContent(bitRoot, bit);

			const sveltePath = path.join(libPath, `${bit}.svelte`);
			fs.writeFileSync(sveltePath, content, { encoding: "utf-8", flag: "w" });
			console.log(`✔ created ${bit}.svelte`);
		} catch (error) {
			const message = error instanceof Error ? error.message : error.toString();
			console.error(`𐄂 failed to create ${bit}.svelte: ` + message);
		}
	}
}
