---
description: Workflow para trabajar con Feature Branches en equipo
---

# 🌿 Feature Branches Workflow

Este documento describe cómo trabajar en equipo usando el modelo de **Feature Branches**.

## Estructura de Ramas

```
main          ← Solo código en producción (intocable directamente)
  └── develop ← Integración de funcionalidades antes de producción
        ├── feature/nueva-funcionalidad-1
        ├── feature/nueva-funcionalidad-2
        └── ...
```

## Reglas de Oro 🏆

1. **NUNCA** hagas commits directamente en `main`
2. **NUNCA** hagas commits directamente en `develop` (excepto hotfixes menores)
3. **SIEMPRE** crea una rama `feature/` para cada tarea o mejora
4. **SIEMPRE** haz Pull Request antes de mergear a `develop`

---

## Flujo de Trabajo

### 1. Comenzar una nueva funcionalidad

```bash
# Asegúrate de estar en develop y actualizado
git checkout develop
git pull origin develop

# Crea tu rama de feature
git checkout -b feature/nombre-descriptivo
```

**Ejemplos de nombres:**
- `feature/rediseno-carrito`
- `feature/integracion-mercadopago`
- `feature/mejora-filtros-productos`

### 2. Trabajar en tu feature

```bash
# Haz commits frecuentes y descriptivos
git add .
git commit -m "feat: agregar validación de stock en carrito"

# Sube tus cambios a GitHub regularmente
git push origin feature/nombre-descriptivo
```

**Convención de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de errores
- `refactor:` Refactorización de código
- `docs:` Cambios en documentación
- `style:` Cambios de formato/estilo
- `chore:` Tareas de mantenimiento

### 3. Integrar a develop (Pull Request)

1. Ve a GitHub: https://github.com/innerdrop/moovy
2. Click en "Pull requests" → "New pull request"
3. Base: `develop` ← Compare: `feature/tu-rama`
4. Describe los cambios realizados
5. Solicita revisión de tu compañero (opcional pero recomendado)
6. Una vez aprobado: **Merge Pull Request**

### 4. Después de mergear

```bash
# Vuelve a develop y actualiza
git checkout develop
git pull origin develop

# Elimina tu rama local (ya no la necesitas)
git branch -d feature/nombre-descriptivo

# Opcional: eliminar rama remota
git push origin --delete feature/nombre-descriptivo
```

---

## Pasar de Develop a Main (Deploy)

Cuando `develop` esté estable y listo para producción:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

O mejor aún, hacerlo via Pull Request en GitHub para tener registro.

---

## Comandos Rápidos de Referencia

| Acción | Comando |
|--------|---------|
| Ver ramas locales | `git branch` |
| Ver todas las ramas | `git branch -a` |
| Cambiar de rama | `git checkout nombre-rama` |
| Crear y cambiar | `git checkout -b nueva-rama` |
| Actualizar rama actual | `git pull origin nombre-rama` |
| Subir cambios | `git push origin nombre-rama` |
| Ver estado | `git status` |
| Ver historial | `git log --oneline -10` |

---

## Resolución de Conflictos

Si al hacer merge hay conflictos:

1. Git marcará los archivos en conflicto
2. Abre cada archivo y busca las marcas `<<<<<<<`, `=======`, `>>>>>>>`
3. Elimina las marcas y deja el código correcto
4. `git add .` y `git commit -m "fix: resolver conflictos de merge"`

---

## Tips para Colaboradores

- **Comunícate** antes de empezar una feature grande
- **Sincroniza** frecuentemente con `develop` para evitar conflictos
- **Revisa** el código del otro cuando hagan PR
- **No acumules** cambios, haz PRs pequeños y frecuentes
