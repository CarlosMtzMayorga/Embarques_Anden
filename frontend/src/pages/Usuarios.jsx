import { useEffect, useState } from 'react';
import { usuariosApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, Input, Modal, PageHeader, Pill, Select, Table } from '../components/ui';

const emptyForm = { usuario: '', nombre: '', rol: 'operador' };

export default function Usuarios() {
  const { user: yo } = useAuth();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [reseteandoId, setReseteandoId] = useState(null);

  function load() {
    setLoading(true);
    usuariosApi.list().then(setUsuarios).finally(() => setLoading(false));
  }

  useEffect(load, []);

  function abrirNuevo() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function abrirEditar(u) {
    setEditing(u);
    setForm({ usuario: u.usuario, nombre: u.nombre, rol: u.rol });
    setModalOpen(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await usuariosApi.update(editing.id, { nombre: form.nombre, rol: form.rol });
        toast('Usuario actualizado');
      } else {
        const creado = await usuariosApi.create(form);
        toast(`Usuario creado — contraseña inicial: ${creado.password_inicial}`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function resetearPassword(u) {
    if (!window.confirm(`¿Restablecer la contraseña de "${u.usuario}" a la estándar?`)) return;
    setReseteandoId(u.id);
    try {
      const { password_nueva } = await usuariosApi.resetPassword(u.id);
      toast(`Contraseña de "${u.usuario}" restablecida a: ${password_nueva}`);
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo restablecer la contraseña', 'error');
    } finally {
      setReseteandoId(null);
    }
  }

  async function toggleActivo(u) {
    if (u.activo && !window.confirm(`¿Desactivar a "${u.usuario}"? No podrá iniciar sesión.`)) return;
    try {
      await usuariosApi.setActivo(u.id, !u.activo);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'No se pudo actualizar', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Alta, baja y edición de cuentas del sistema"
        actions={<Button onClick={abrirNuevo}>+ Nuevo usuario</Button>}
      />

      <Table
        columns={['Usuario', 'Nombre', 'Rol', 'Estado', '']}
        rows={usuarios}
        empty={!loading && usuarios.length === 0 ? 'Sin usuarios registrados' : null}
        renderRow={(u) => (
          <tr key={u.id}>
            <td className="px-3 py-2 font-mono text-xs">{u.usuario}</td>
            <td className="px-3 py-2 font-medium">{u.nombre}</td>
            <td className="px-3 py-2">
              <Pill tone={u.rol === 'admin' ? 'dark' : 'gray'}>{u.rol}</Pill>
            </td>
            <td className="px-3 py-2">
              <Pill tone={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Pill>
            </td>
            <td className="px-3 py-2">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => abrirEditar(u)} className="text-blue-600 hover:text-blue-800">Editar</button>
                <button
                  onClick={() => resetearPassword(u)}
                  disabled={reseteandoId === u.id}
                  className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                >
                  {reseteandoId === u.id ? 'Restableciendo…' : 'Restablecer contraseña'}
                </button>
                <button
                  onClick={() => toggleActivo(u)}
                  disabled={u.id === yo?.id}
                  title={u.id === yo?.id ? 'No puedes desactivar tu propia cuenta' : ''}
                  className="text-red-500 hover:text-red-700 disabled:opacity-40 disabled:hover:text-red-500"
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </td>
          </tr>
        )}
        renderCard={(u) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink-900">{u.nombre}</p>
                <p className="font-mono text-xs text-ink-500">{u.usuario}</p>
              </div>
              <Pill tone={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Pill>
            </div>
            <div className="mt-1">
              <Pill tone={u.rol === 'admin' ? 'dark' : 'gray'}>{u.rol}</Pill>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-cream-200 pt-2 text-sm">
              <button onClick={() => abrirEditar(u)} className="text-blue-600 hover:text-blue-800">Editar</button>
              <button
                onClick={() => resetearPassword(u)}
                disabled={reseteandoId === u.id}
                className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
              >
                {reseteandoId === u.id ? 'Restableciendo…' : 'Restablecer contraseña'}
              </button>
              <button
                onClick={() => toggleActivo(u)}
                disabled={u.id === yo?.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                {u.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={guardar} className="space-y-4">
          <Field label="Usuario (nombre de acceso)">
            <Input
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              disabled={!!editing}
              required
            />
          </Field>
          <Field label="Nombre completo">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Field>
          <Field label="Rol">
            <Select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="operador">Operador</option>
              <option value="admin">Administrador</option>
            </Select>
          </Field>
          {!editing && (
            <p className="text-xs text-ink-400">
              La contraseña inicial se genera automáticamente (usuario + "123") y se te mostrará al guardar.
            </p>
          )}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
