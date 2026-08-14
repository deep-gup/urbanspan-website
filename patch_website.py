import os

def patch_app_jsx():
    path = "src/App.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if "ProductDetailsPage" not in content:
        content = content.replace(
            "import ProductCatalog from './components/ProductCatalog';",
            "import ProductCatalog from './components/ProductCatalog';\nimport ProductDetailsPage from './components/ProductDetailsPage';"
        )

    if "/products/:id" not in content:
        target_route = """<Route path="/products" element={
            <div className="pt-24">
              <SEO title="Product Catalog" />
              <ProductCatalog onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />"""
        
        replacement_route = """<Route path="/products" element={
            <div className="pt-24">
              <SEO title="Product Catalog" />
              <ProductCatalog onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />

          <Route path="/products/:id" element={
            <div className="pt-24">
              <SEO title="Product Details" />
              <ProductDetailsPage onSelectProductForInquiry={handleProductInquiry} />
            </div>
          } />"""
        
        content = content.replace(target_route, replacement_route)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def patch_product_catalog():
    path = "src/components/ProductCatalog.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Image click
    content = content.replace(
        '<div className="relative h-48 overflow-hidden bg-slate-50">',
        '''<div 
                className="relative h-48 overflow-hidden bg-slate-50 cursor-pointer"
                onClick={() => {
                  navigate(`/products/${product.sku}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >'''
    )

    # H3 click
    content = content.replace(
        '<h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-brand-steel-light transition-colors">',
        '''<h3 
                    onClick={() => {
                      navigate(`/products/${product.sku}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-lg font-bold text-slate-900 leading-snug mb-2 hover:text-brand-steel-light transition-colors cursor-pointer"
                  >'''
    )

    # Specs click
    content = content.replace(
        'onClick={() => setSelectedModalProduct(product)}',
        '''onClick={() => {
                        navigate(`/products/${product.sku}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}'''
    )

    # Remove Modal
    start_modal = content.find("{/* Product Spec Detail Modal */}")
    if start_modal != -1:
        end_modal = content.find("</div>\n  );\n}", start_modal)
        if end_modal != -1:
            content = content[:start_modal] + content[end_modal:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def patch_nginx():
    path = "nginx.conf"
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "/sitemap.xml" not in content:
        proxy_block = """
    location /sitemap.xml {
        proxy_pass https://api.urbanspaninfra.co.in/api/external/sitemap.xml;
        proxy_ssl_server_name on;
    }
"""
        content = content.replace("location / {", proxy_block + "\n    location / {")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

patch_app_jsx()
patch_product_catalog()
patch_nginx()
print("Success")
