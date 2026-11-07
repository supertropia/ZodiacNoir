import { ImportWizard } from "@/components/admin/ImportWizard";
import { buildCategoryTree, loadCategoryRows } from "@/lib/store-categories";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  // Categorías de la tienda para elegir en los productos: «Imprimibles», «Imprimibles › Calendarios», etc.
  const options: { id: string; label: string }[] = [];
  try {
    const tree = buildCategoryTree(await loadCategoryRows());
    for (const top of tree) {
      options.push({ id: top.id, label: top.name });
      for (const child of top.children) options.push({ id: child.id, label: `${top.name} › ${child.name}` });
    }
  } catch (error) {
    console.error("No se pudieron cargar las categorías de la tienda:", error);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-gold-pale">Importar artículos y productos</h1>
      <p className="mt-2 max-w-3xl font-ui text-sm text-gold-dim">
        Sube una carpeta (o un .zip) con el Word de instrucciones de cada artículo o producto, el Word del texto, las imágenes, el PDF y el
        video si lo hay. Todo se crea como <strong>borrador</strong>: no se ve en la web hasta que lo apruebes aquí con el ✓, ya sea para
        publicarlo ahora o programarlo.
      </p>
      <div className="mt-8">
        <ImportWizard storeCategories={options} />
      </div>
    </div>
  );
}
