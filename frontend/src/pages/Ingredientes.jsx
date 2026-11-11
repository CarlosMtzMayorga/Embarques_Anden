import { useEffect, useState } from 'react';
import { ingredientesApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import { Button, Card, Field, Input, Modal, PageHeader, Pill, Table, Textarea } from '../components/ui';

const emptyForm = { nombre: '', texto: '' };

export default function Ingredientes() {
  const toast = useToast();
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    ingredientesApi
      .list()
      .then(setIngredientes)
      .catch(() => toast('No se pudieron cargar los ingredientes', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function abrirNuevo() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function abrirEditar(item) {
    setEditing(item);
    setForm({ nombre: item.nombre, texto: item.texto });
    setModalOpen(true);
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.texto.trim()) {
      toast('Por favor completa el nombre y el texto de ingredientes', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await ingredientesApi.update(editing.id, { ...form, activo: editing.activo });
        toast('Fórmula de ingredientes actualizada');
      } else {
        await ingredientesApi.create(form);
        toast('Fórmula de ingredientes creada');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(item) {
    try {
      if (item.activo) {
        await ingredientesApi.remove(item.id);
        toast('Fórmula desactivada');
      } else {
        await ingredientesApi.update(item.id, { ...item, activo: true });
        toast('Fórmula activada');
      }
      load();
    } catch {
      toast('No se pudo actualizar el estado', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Ingredientes de Etiqueta"
        subtitle="Configuración de fórmulas y declaraciones de ingredientes para impresión en etiquetas térmicas"
        actions={<Button onClick={abrirNuevo}>+ Nueva fórmula</Button>}
      />

      <Table
        columns={['ID', 'Nombre / Fórmula', 'Texto legal en etiqueta', 'Estado', '']}
        rows={ingredientes}
        empty={!loading && ingredientes.length === 0 ? 'Sin fórmulas de ingredientes registradas' : null}
        renderRow={(item) => (
          <tr key={item.id}>
            <td className="px-3 py-2 font-mono text-xs text-ink-400">{item.id}</td>
            <td className="px-3 py-2 font-medium text-ink-900">{item.nombre}</td>
            <td className="px-3 py-2 text-xs text-ink-600 max-w-md line-clamp-2 leading-relaxed">
              {item.texto}
            </td>
            <td className="px-3 py-2">
              <Pill tone={item.activo ? 'green' : 'gray'}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Pill>
            </td>
            <td className="px-3 py-2 text-right space-x-3">
              <button
                onClick={() => abrirEditar(item)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => toggleActivo(item)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </button>
            </td>
          </tr>
        )}
        renderCard={(item) => (
          <Card className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-ink-400">ID #{item.id}</span>
                <p className="font-semibold text-ink-900">{item.nombre}</p>
              </div>
              <Pill tone={item.activo ? 'green' : 'gray'}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Pill>
            </div>
            <p className="text-xs text-ink-600 bg-cream-100 p-2.5 rounded-lg border border-cream-200 leading-relaxed">
              {item.texto}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => abrirEditar(item)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                onClick={() => toggleActivo(item)}
                className="text-sm font-medium text-red-500 hover:text-red-700"
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </Card>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar fórmula de ingredientes' : 'Nueva fórmula de ingredientes'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <Field label="Nombre descriptivo de la fórmula">
            <Input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Detallado (inyectado, con aditivos) o Simple"
            />
            <p className="text-xs text-ink-400 mt-1">
              Identificador corto que se seleccionará en el catálogo de productos.
            </p>
          </Field>

          <Field label="Texto completo de ingredientes (impresión en etiqueta)">
            <Textarea
              required
              rows={4}
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="Ej: Carne de Res, sal, fosfatos, dextrosa, antioxidantes..."
            />
            <p className="text-xs text-ink-400 mt-1">
              Este texto se formateará y envolverá automáticamente en la parte inferior de la etiqueta térmica Zebra.
            </p>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar fórmula'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
