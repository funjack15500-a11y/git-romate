import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const html = read("index.html");
const bundle = JSON.parse(read("prompts.json"));
const prompts = Array.isArray(bundle.prompts) ? bundle.prompts : [];

check(prompts.length > 0, "prompts.json 中没有提示词");
check(Array.isArray(bundle.categories), "prompts.json 缺少 categories 数组");
check(!/<script[^>]+src=["']js\/data\.js["']/i.test(html), "线上入口不应直接加载 data.js");

const htmlIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateHtmlIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
check(duplicateHtmlIds.length === 0, `HTML 存在重复 id：${[...new Set(duplicateHtmlIds)].join(", ")}`);

const promptIds = prompts.map((item) => String(item.id || ""));
const duplicatePromptIds = promptIds.filter((id, index) => promptIds.indexOf(id) !== index);
check(duplicatePromptIds.length === 0, `提示词存在重复 id：${[...new Set(duplicatePromptIds)].join(", ")}`);

for (const [index, item] of prompts.entries()) {
  check(Boolean(item.id), `第 ${index + 1} 条缺少 id`);
  check(Boolean(item.title), `${item.id || `第 ${index + 1} 条`} 缺少标题`);
  check(Boolean(item.prompt), `${item.id || `第 ${index + 1} 条`} 缺少提示词正文`);
  check(["generate", "edit"].includes(item.type), `${item.id || `第 ${index + 1} 条`} 的 type 无效`);
  check(bundle.categories.includes(item.category), `${item.id || `第 ${index + 1} 条`} 使用了未声明分类 ${item.category}`);
}

const localRefs = [...html.matchAll(/\s(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((ref) => !/^(?:https?:|#|mailto:|tel:|data:)/i.test(ref));
for (const ref of new Set(localRefs)) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  check(fs.existsSync(path.join(root, clean)), `入口引用的本地资源不存在：${clean}`);
}

for (const file of ["js/app.js", "js/config.js", "js/data.js"]) {
  try {
    new vm.Script(read(file), { filename: file });
  } catch (error) {
    failures.push(`${file} 语法错误：${error.message}`);
  }
}

if (failures.length) {
  console.error(`站点自检失败（${failures.length} 项）：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`站点自检通过：${prompts.length} 条提示词，${bundle.categories.length} 个分类，${new Set(localRefs).size} 个本地入口资源。`);
}
