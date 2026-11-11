import { useEffect, useState } from 'react';
import { productosApi, ingredientesApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import { Button, Card, Field, Input, Modal, PageHeader, Pill, Select, Table } from '../components/ui';

const emptyForm = { codigo: '', nombre: '', tipo_ganado: 'Ambos', ingrediente_id: '' };

export default function Productos() {
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    productosApi
      .list()
      .then(setProductos)
      .catch(() => toast('No se pudieron cargar los productos', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    productosApi.tiposGanado().then(setTipos).catch(() => setTipos([]));
    ingredientesApi.list().then(setIngredientes).catch(() => setIngredientes([]));
  }, []);

  function abrirNuevo() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function abrirEditar(p) {
    setEditing(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      tipo_ganado: p.tipo_ganado || 'Ambos',
      ingrediente_id: p.ingrediente_id ? String(p.ingrediente_id) : '',
    });
    setModalOpen(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        ingrediente_id: form.ingrediente_id ? Number(form.ingrediente_id) : null,
      };
      if (editing) {
        await productosApi.update(editing.id, { ...payload, activo: editing.activo });
        toast('Producto actualizado');
      } else {
        await productosApi.create(payload);
        toast('Producto creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(p) {
    try {
      if (p.activo) {
        await productosApi.remove(p.id);
      } else {
        await productosApi.update(p.id, { ...p, activo: true });
      }
      load();
    } catch {
      toast('No se pudo actualizar', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de cortes y asignación de fórmulas de ingredientes para etiquetas"
        actions={<Button onClick={abrirNuevo}>+ Nuevo producto</Button>}
      />

      <Table
        columns={['Código', 'Nombre', 'Tipo de ganado', 'Ingredientes en etiqueta', 'Estado', '']}
        rows={productos}
        empty={!loading && productos.length === 0 ? 'Sin productos registrados' : null}
        renderRow={(p) => (
          <tr key={p.id}>
            <td className="px-3 py-2 font-medium font-mono text-ink-900">{p.codigo}</td>
            <td className="px-3 py-2 font-medium">{p.nombre}</td>
            <td className="px-3 py-2 text-ink-600">{p.tipo_ganado}</td>
            <td className="px-3 py-2">
              {p.ingrediente_nombre ? (
                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  {p.ingrediente_nombre}
                </span>
              ) : (
                <span className="text-xs text-ink-400 italic">Sin ingredientes asignados</span>
              )}
            </td>
            <td className="px-3 py-2">
              <Pill tone={p.activo ? 'green' : 'gray'}>{p.activo ? 'Activo' : 'Inactivo'}</Pill>
            </td>
            <td className="px-3 py-2 text-right space-x-3">
              <button onClick={() => abrirEditar(p)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Editar
              </button>
              <button
                onClick={() => toggleActivo(p)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                {p.activo ? 'Desactivar' : 'Activar'}
              </button>
            </td>
          </tr>
        )}
        renderCard={(p) => (
          <Card className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-ink-500">{p.codigo}</span>
                <p className="font-semibold text-ink-900">{p.nombre}</p>
              </div>
              <Pill tone={p.activo ? 'green' : 'gray'}>{p.activo ? 'Activo' : 'Inactivo'}</Pill>
            </div>
            <p className="text-xs text-ink-500">{p.tipo_ganado}</p>
            <div>
              {p.ingrediente_nombre ? (
                <span className="inline-block rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  Fórmula: {p.ingrediente_nombre}
                </span>
              ) : (
                <span className="text-xs text-ink-400 italic">Sin ingredientes en etiqueta</span>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-4 border-t border-cream-200 pt-2 text-sm font-medium">
              <button onClick={() => abrirEditar(p)} className="text-blue-600 hover:text-blue-800">
                Editar
              </button>
              <button onClick={() => toggleActivo(p)} className="text-red-500 hover:text-red-700">
                {p.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </Card>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={guardar} className="space-y-4">
          <Field label="Código">
            <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
          </Field>
          <Field label="Nombre del corte / producto">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Field>
          <Field label="Tipo de ganado">
            <Select value={form.tipo_ganado} onChange={(e) => setForm({ ...form, tipo_ganado: e.target.value })}>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fórmula de ingredientes para etiqueta térmica">
            <Select
              value={form.ingrediente_id}
              onChange={(e) => setForm({ ...form, ingrediente_id: e.target.value })}
            >
              <option value="">-- Sin ingredientes (no imprimir en etiqueta) --</option>
              {ingredientes
                .filter((i) => i.activo)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
            </Select>
            <p className="text-xs text-ink-400 mt-1">
              Puedes agregar o modificar fórmulas en el menú <strong>Catálogos → Ingredientes</strong>.
            </p>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
