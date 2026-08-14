import os
import glob

replacements = {
    'amber-500': 'brand-steel',
    'amber-400': 'brand-steel-light',
    'amber-300': 'blue-300',
    'bg-gradient-industrial': 'bg-gradient-primary',
    'bg-[#080d1a]': 'bg-brand-navy-dark',
    'bg-slate-950': 'bg-brand-navy-dark',
    'bg-slate-900': 'bg-brand-navy',
    'bg-slate-800': 'bg-brand-navy-light',
    'border-slate-800': 'border-brand-navy-light',
    'text-slate-950': 'text-white'
}

files = glob.glob('src/**/*.jsx', recursive=True)

for file_path in files:
    # Skip Hero and Navbar since I already manually rewrote them
    if 'Hero.jsx' in file_path or 'Navbar.jsx' in file_path:
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Done.")
