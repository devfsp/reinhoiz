import {readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync} from 'fs';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import {Product, ProductImage} from './transform';

const ogSiteName = 'http://www.reinhoiz.de';

interface MetaAttributes {
  ogImage: string;
  ogTitle: string;
  ogType: string;
  ogUrl: string;
  ogSiteName: string;
  ogDescription: string | Handlebars.SafeString;  // Typ angepasst
}

interface Page {
  tags: string[];
  mainTemplate: () => string;
  metaAttributes: MetaAttributes;
}

const products: Product[] = JSON.parse(
  readFileSync('dist/bootstrap/produkt/products.json', 'utf-8'),
);
products.sort((p1, p2) => p1.name.localeCompare(p2.name));
for (const product of products) {
  product.images.sort(sortImages);
}

const tags = [...new Set(([] as string[]).concat(...products.map((p) => p.tags)))].sort();

Handlebars.registerPartial('home', getTemplate('src/home.html.mustache'));
Handlebars.registerPartial('product', getTemplate('src/product.html.mustache'));
Handlebars.registerPartial('category', getTemplate('src/category.html.mustache'));
Handlebars.registerPartial('preview', getTemplate('src/preview.html.mustache'));
Handlebars.registerPartial('impressum', getTemplate('src/impressum.html.mustache'));
Handlebars.registerPartial('data-protection', getTemplate('src/data-protection.html.mustache'));
Handlebars.registerPartial('404', getTemplate('src/404.html.mustache'));

const pageTemplate = Handlebars.compile(readFileSync('src/index.html.mustache', 'utf-8'));

/** HOME */
interface PageHome extends Page {
  products: Product[];
}
const homeModel: PageHome = {
  tags: tags,
  products: products,
  mainTemplate: () => 'home',
  metaAttributes: {
    ogImage: products[0].images[0].large,
    ogSiteName,
    ogTitle: 'Hochwertige Dekorationsgegenstände aus Holz. reinhoiz.de',
    ogDescription: 'Hochwertige Dekorationsgegenstände aus Holz,
    ogType: 'website',
    ogUrl: 'http://www.reinhoiz.de',
  },
};
writeFileSync('dist/bootstrap/index.html', pageTemplate(homeModel), 'utf-8');

/** Products */
interface PageProduct extends Page {
  product: Product;
}
for (let product of products) {
  const productModel: PageProduct = {
    tags: tags,
    product: product,
    mainTemplate: () => 'product',
    metaAttributes: {
      ogDescription: new Handlebars.SafeString(marked(product.description)), 
      ogImage: product.images[0].large,
      ogSiteName,
      ogTitle: product.name,
      ogType: 'website',
      ogUrl: `http://www.reinhoiz.de/produkt/${product.id}/`,
    },
  };

  const productTemplate = Handlebars.compile(getTemplate('src/index.html.mustache'));
  writeFileSync(
    `dist/bootstrap/produkt/${product.id}/index.html`,
    productTemplate(productModel),
    'utf-8',
  );
}

/** Kategorien */
interface PageCategory extends Page {
  tag: string;
  products: Product[];
}
for (let tag of tags) {
  const categoryModel: PageCategory = {
    tags: tags,
    tag: tag,
    products: products.filter((p) => p.tags.includes(tag)),
    mainTemplate: () => 'category',
    metaAttributes: {
      ogDescription: `Alles zum Thema ${tag}`,
      ogImage: products[0].images[0].large,
      ogSiteName,
      ogTitle: `Kategorie ${tag}`,
      ogType: 'website',
      ogUrl: `http://www.reinhoiz.de/kategorie/${tag}.html`,
    },
  };
  if (!existsSync(`dist/bootstrap/kategorie`)) {
    mkdirSync(`dist/bootstrap/kategorie`);
  }
  const productTemplate = Handlebars.compile(getTemplate('src/index.html.mustache'));
  writeFileSync(`dist/bootstrap/kategorie/${tag}.html`, productTemplate(categoryModel), 'utf-8');
}

/** Impressum */
const impressumModel: Page = {
  tags: tags,
  mainTemplate: () => 'impressum',
  metaAttributes: {
    ogDescription: 'Impressum',
    ogImage: products[0].images[0].large,
    ogSiteName,
    ogTitle: 'Impressum',
    ogType: 'website',
    ogUrl: `http://www.reinhoiz.de/impressum.html`,
  },
};
writeFileSync('dist/bootstrap/impressum.html', pageTemplate(impressumModel), 'utf-8');

/** Datenschutz */
const dataProtectionModel: Page = {
  tags: tags,
  mainTemplate: () => 'data-protection',
  metaAttributes: {
    ogDescription: 'Datenschutzerklärung',
    ogImage: products[0].images[0].large,
    ogSiteName,
    ogTitle: 'Datenschutzerklärung',
    ogType: 'website',
    ogUrl: `http://www.reinhoiz.de/datenschutz.html`,
  },
};
writeFileSync('dist/bootstrap/datenschutz.html', pageTemplate(dataProtectionModel), 'utf-8');

/** 404 */
interface PageHome extends Page {
  products: Product[];
}
const _404Model: PageHome = {
  tags: tags,
  products: products,
  mainTemplate: () => '404',
  metaAttributes: {
    ogImage: products[0].images[0].large,
    ogSiteName,
    ogTitle: 'Schöne Bastelsachen aus Holz. reinhoiz.de',
    ogDescription: 'Hier findest du Bastelsachen aus Holz',
    ogType: 'website',
    ogUrl: 'http://www.reinhoiz.de',
  },
};
writeFileSync('dist/bootstrap/404.html', pageTemplate(_404Model), 'utf-8');

/* other files */
copyFileSync('src/robots.txt', 'dist/bootstrap/robots.txt');

function getTemplate(file: string) {
  const template = readFileSync(file, 'utf-8');
  return template;
}

function sortImages(i1: ProductImage, i2: ProductImage): number {
  const getSort = (path: string) => {
    try {
      /**
       * small: kugeln/100__PXL_120232.jpg
       */
      const imageName = path.split('/')[1];
      const sort = Number.parseInt(imageName.split('__')[0]);
      if (isNaN(sort)) {
        throw Error('NAN');
      }
      return sort;
    } catch {
      return 10000;
    }
  };

  return getSort(i1.small) - getSort(i2.small);
}
