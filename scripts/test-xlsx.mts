import * as XLSX from "xlsx";
const sheet = XLSX.utils.aoa_to_sheet([
  ["Mandi", "District", "Commodity", "Unit", "Min", "Modal", "Max"],
  ["National", "Islamabad", "Wheat", "40 Kg", 3200, 3400, 3600],
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
console.log("buffer type:", buffer.constructor.name, "length:", buffer.length);
const wb2 = XLSX.read(buffer, { type: "array" });
console.log("sheets:", wb2.SheetNames);
const rows = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { defval: "" });
console.log("rows:", JSON.stringify(rows, null, 2));
