import os

files_to_update = [
    'src/components/ProductCatalog.jsx',
    'src/components/DynamicForm.jsx',
    'src/components/CustomerPortal.jsx',
    'src/components/LeadCaptureForm.jsx',
    'src/components/ApiConfigModal.jsx',
    'src/components/LiveChatWidget.jsx'
]

replacements = {
    'bg-brand-navy-dark': 'bg-slate-50',
    'bg-brand-navy': 'bg-white',
    'bg-brand-navy-light': 'bg-slate-100',
    'border-brand-navy-light': 'border-slate-200',
    'text-white': 'text-slate-900',
    'text-slate-300': 'text-slate-600',
    'text-slate-400': 'text-slate-500',
    'glass-panel': 'bg-white shadow-lg border border-slate-200', # Remove glass on light mode
    'glass-card': 'bg-white shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-steel/40 transition-all',
}

for file_path in files_to_update:
    if os.path.exists(file_path):
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
