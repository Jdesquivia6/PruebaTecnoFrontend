document.addEventListener("DOMContentLoaded", () => {
    cargarEmpleados();
});

let estadoOrden = {};

async function cargarEmpleados(orden = '') {
    try {
        const url = orden
            ? `http://127.0.0.1:8000/api/v1/empleados?ordering=${encodeURIComponent(orden)}`
            : `http://127.0.0.1:8000/api/v1/empleados`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const empleados = await response.json();
        actualizarTabla(empleados);
    } catch (error) {
        console.error("Error al cargar empleados:", error);
    }
}

async function filtrarEmpleados(campo) {
    const valor = document.getElementById(`filtro${campo}`).value.trim();
    if (!valor) return cargarEmpleados();
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/empleadosFilter/?${campo.toLowerCase()}=${encodeURIComponent(valor)}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        actualizarTabla(await response.json());
    } catch (error) {
        console.error(`Error al filtrar empleados por ${campo}:`, error);
    }
}

document.querySelectorAll("[id^='filtro']").forEach(input => {
    input.addEventListener("input", () => filtrarEmpleados(input.id.replace("filtro", "")));
});

function actualizarTabla(empleados) {
    const tbody = document.getElementById("tablaEmpleados");
    tbody.innerHTML = empleados.map((empleado, index) => `
        <tr id="empleado_${empleado.id}">
            <th scope="row">${index + 1}</th>
            <td>${empleado.nombre || "Sin nombre"}</td>
            <td>${empleado.telefono || "No disponible"}</td>
            <td>${empleado.cedula || "No disponible"}</td>
            <td>${empleado.fecha_nacimiento || "No disponible"}</td>
            <td>${empleado.email || "No disponible"}</td>
            <td>
                <button class="btn btn-warning" onclick="cargarDatosEmpleado(${empleado.id})">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-danger" onclick="eliminarEmpleado(${empleado.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

document.querySelectorAll(".sortable").forEach(header => {
    header.addEventListener("click", () => {
        const columna = header.dataset.columna;
        ordenarTabla(columna, header);
    });
});

function ordenarTabla(columna, header) {
    let tbody = document.getElementById("tablaEmpleados");
    let filas = Array.from(tbody.rows);
    
    estadoOrden[columna] = !estadoOrden[columna];

    filas.sort((a, b) => {
        let valorA = a.querySelector(`td:nth-child(${columna})`).textContent.trim();
        let valorB = b.querySelector(`td:nth-child(${columna})`).textContent.trim();

        if (!isNaN(valorA) && !isNaN(valorB)) {
            valorA = Number(valorA);
            valorB = Number(valorB);
        }

        return estadoOrden[columna] ? valorA.localeCompare(valorB, undefined, { numeric: true }) : valorB.localeCompare(valorA, undefined, { numeric: true });
    });

    tbody.innerHTML = "";
    filas.forEach(fila => tbody.appendChild(fila));

    actualizarIconosOrden(header, estadoOrden[columna]);
}

function actualizarIconosOrden(header, ascendente) {
    document.querySelectorAll(".sortable i").forEach(icono => icono.remove());

    const icono = document.createElement("i");
    icono.className = ascendente ? "bi bi-arrow-up" : "bi bi-arrow-down"; 

    header.appendChild(icono);
}

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioEmpleado");
    const modal = new bootstrap.Modal(document.getElementById("agregarEmpleadoModal"));

    formulario.addEventListener("submit", async event => {
        event.preventDefault();

        const empleado = Object.fromEntries(new FormData(formulario));

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/registroEmpleados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(empleado),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Empleado registrado correctamente.");
                modal.hide();
                formulario.reset();
                cargarEmpleados();
            } else {
                console.error("Error en la solicitud:", error);
            }
        } catch (error) {
            console.error("", error);
        }
    });
});


async function cargarDatosEmpleado(id) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/empleados/${id}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const empleado = await response.json();

        window.empleadoActual = { ...empleado };

        ["id", "nombre", "cedula", "fecha_nacimiento", "email", "telefono"].forEach(field => {
            const input = document.getElementById(`editar_${field}`);
            if (input) input.value = empleado[field] || "";
        });

        new bootstrap.Modal(document.getElementById("editarEmpleadoModal")).show();
    } catch (error) {
        console.error("Error al obtener datos del empleado:", error);
        alert("No se pudieron cargar los datos del empleado.");
    }
}

document.getElementById("editarEmpleadoForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const empleadoId = document.getElementById("editar_id").value.trim();
    if (!empleadoId) {
        alert("Error: No se encontró el ID del empleado.");
        return;
    }

    const formData = new FormData(this);
    const empleadoData = {};

    formData.forEach((value, key) => {
        if (value.trim() !== "") {
            empleadoData[key] = key === "id" ? Number(value) : value;
        }
    });

    console.log("Datos enviados al backend:", JSON.stringify(empleadoData));

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/empleados/${empleadoId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(empleadoData),
        });

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        if (response.ok) {
            alert("Empleado actualizado correctamente.");
            const modalElement = document.getElementById("editarEmpleadoModal");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            } else {
                new bootstrap.Modal(modalElement).hide();
            }

            cargarEmpleados();
        } else {
            alert(`Error: ${data.error || "No se pudo actualizar el empleado."}`);
        }
    } catch (error) {
        console.error("Error en la actualización:", error);
        alert("Hubo un error al actualizar el empleado.");
    }
});

async function eliminarEmpleado(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este empleado?")) return;
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/empleados/${id}`, { method: "DELETE" });
        if (response.ok) {
            alert("Empleado eliminado exitosamente.");
            cargarEmpleados();
        } else {
            alert("Error al eliminar el empleado.");
        }
    } catch (error) {
        console.error("Error en la eliminación:", error);
        alert("Hubo un error al conectar con el servidor.");
    }
}
