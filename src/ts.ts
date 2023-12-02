import ts from "typescript";

// courtesy of dr. chatGPT
export function extractConstants(sourceCode: string) {
	const constantsMap = new Map<string, Record<string, string>[]>();

	const sourceFile = ts.createSourceFile(
		"temp.ts",
		sourceCode,
		ts.ScriptTarget.Latest,
		true
	);

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			node.declarationList.declarations.forEach((declaration) => {
				if (ts.isVariableDeclaration(declaration)) {
					const constantName = declaration.name.getText();
					const initializer = declaration.initializer;

					if (initializer && ts.isObjectLiteralExpression(initializer)) {
						const dataAttributes: Record<string, string>[] = [];

						initializer.properties.forEach((property) => {
							if (
								ts.isPropertyAssignment(property) &&
								property.name.getText() === "dataAttributes"
							) {
								if (ts.isArrayLiteralExpression(property.initializer)) {
									property.initializer.elements.forEach((element) => {
										if (ts.isObjectLiteralExpression(element)) {
											const dataAttribute: Record<string, string> = {};
											element.properties.forEach((attr) => {
												if (ts.isPropertyAssignment(attr)) {
													dataAttribute[attr.name.getText()] = JSON.parse(
														attr.initializer.getText()
													);
												}
											});
											dataAttributes.push(dataAttribute);
										}
									});
								}
							}
						});

						if (dataAttributes.length > 0) {
							constantsMap.set(constantName, dataAttributes);
						}
					}
				}
			});
		}
	});

	return constantsMap;
}
