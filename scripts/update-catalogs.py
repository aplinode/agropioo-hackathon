import os

crops = [
    "barley", "bajra", "jowar", "tobacco", "sunflower", "canola", "sesame",
    "lentil", "pigeon_pea", "black_gram", "pea", "cowpea",
    "cauliflower", "cabbage", "brinjal", "okra", "chili", "garlic", "ginger",
    "cucumber", "watermelon", "pumpkin", "carrot", "spinach", "fenugreek",
    "mango", "citrus", "guava", "apple",
]
rotations = [
    "barley_then_chickpea", "bajra_then_cowpea", "sunflower_then_wheat",
    "canola_then_wheat", "lentil_then_cotton", "pea_then_maize",
    "cauliflower_then_pea", "okra_then_cowpea", "garlic_then_wheat",
]

for lang in ["en", "ur", "pa", "ps", "sd", "skr", "bal", "hno"]:
    path = f"catalog/{lang}.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    insert_idx = content.rfind("} as const;")
    if insert_idx == -1:
        insert_idx = content.rfind("};")
    if insert_idx == -1:
        print(f"Could not find insertion point in {path}")
        continue

    new_lines = []
    for c in crops:
        label = c.replace("_", " ").title()
        new_lines.append(f'  "app.crops.catalogue.{c}": "{label}",')
    for r in rotations:
        label = r.replace("_", " ").title()
        new_lines.append(f'  "app.crops.rotation.{r}": "Rotation benefit for {label}",')

    new_block = "\n" + "\n".join(new_lines) + "\n"
    content = content[:insert_idx] + new_block + content[insert_idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {path}")
