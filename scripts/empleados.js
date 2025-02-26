document.addEventListener("DOMContentLoaded", () => cargarEmpleados());

async function cargarEmpleados(orden = "") {
    try {
        const url = `https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/empleados${orden ? `?ordering=${encodeURIComponent(orden)}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        actualizarTabla(await response.json());
    } catch (error) {
        console.error("Error al cargar empleados:", error);
    }
}

document.querySelectorAll("[id^='filtro']").forEach(input => {
    input.addEventListener("input", () => filtrarEmpleados(input.id.replace("filtro", "")));
});

async function filtrarEmpleados(campo) {
    const valor = document.getElementById(`filtro${campo}`).value.trim();
    if (!valor) return cargarEmpleados();
    try {
        const response = await fetch(`https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/empleadosFilter/?${campo.toLowerCase()}=${encodeURIComponent(valor)}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        actualizarTabla(await response.json());
    } catch (error) {
        console.error(`Error al filtrar empleados por ${campo}:`, error);
    }
}

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
    let estadoOrden = {};
    
    if (!(columna in estadoOrden)) {
        estadoOrden[columna] = true; 
    } else {
        estadoOrden[columna] = !estadoOrden[columna]; 
    }

    filas.sort((a, b) => {
        let valorA = a.cells[columna - 1].textContent.trim();
        let valorB = b.cells[columna - 1].textContent.trim();

        if (columna === 3 || columna === 4) {
            valorA = valorA.replace(/\D/g, ""); 
            valorB = valorB.replace(/\D/g, ""); 

            if (!isNaN(valorA) && !isNaN(valorB)) {
                valorA = Number(valorA);
                valorB = Number(valorB);
            }
        }

        let comparacion = valorA.localeCompare(valorB, undefined, { numeric: true });

        return estadoOrden[columna] ? comparacion : -comparacion;
    });

    tbody.innerHTML = "";
    filas.forEach(fila => tbody.appendChild(fila));

    actualizarIconosOrden(header, estadoOrden[columna]);
}


function actualizarIconosOrden(header, ascendente) {
    document.querySelectorAll(".sortable i").forEach(icono => icono.remove());

    const icono = document.createElement("i");
    icono.className = ascendente ? "bi bi-caret-up-fill ms-2" : "bi bi-caret-down-fill ms-2"; 

    header.appendChild(icono);
}

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formularioEmpleado");
    const modal = new bootstrap.Modal(document.getElementById("agregarEmpleadoModal"));

    if (!formulario) {
        console.error("Error: No se encontró el formulario con ID 'formularioEmpleado'");
        return;
    }

    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("Formulario enviado");

        const empleado = Object.fromEntries(new FormData(formulario));

        try {
            const response = await fetch("https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/registroEmpleados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(empleado),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Empleado registrado correctamente.");
                formulario.reset();
                modal.hide();
                cargarEmpleados();
            } else {
                alert("Error en la solicitud",response.data);
                console.error("Error en la solicitud:", data);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
        }
    });
});

async function cargarDatosEmpleado(id) {
    try {
        const response = await fetch(`https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/empleados/${id}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const empleado = await response.json();
        Object.keys(empleado).forEach(field => {
            const input = document.getElementById(`editar_${field}`);
            if (input) input.value = empleado[field] || "";
        });
        new bootstrap.Modal(document.getElementById("editarEmpleadoModal")).show();
    } catch (error) {
        console.error("Error al obtener datos del empleado:", error);
        alert("No se pudieron cargar los datos del empleado.");
    }
}

document.getElementById("editarEmpleadoForm")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const empleadoId = document.getElementById("editar_id").value.trim();
    if (!empleadoId) return alert("Error: No se encontró el ID del empleado.");
    const formData = new FormData(this);
    const empleadoData = Object.fromEntries(formData);
    try {
        const response = await fetch(`https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/empleados/${empleadoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(empleadoData),
        });
        if (response.ok) {
            alert("Empleado actualizado correctamente.");
            bootstrap.Modal.getInstance(document.getElementById("editarEmpleadoModal"))?.hide();
            cargarEmpleados();
        } else {
            alert("Error al actualizar el empleado.", response.data);
            alert("Error al actualizar el empleado.");
        }
    } catch (error) {
        console.error("Error en la actualización:", error);
    }
});

async function eliminarEmpleado(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este empleado?")) return;
    try {
        const response = await fetch(`https://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/empleados/${id}`, { method: "DELETE" });
        if (response.ok) {
            alert("Empleado eliminado exitosamente.");
            cargarEmpleados();
        } else {
            alert("Error al eliminar el empleado.");
        }
    } catch (error) {
        console.error("Error en la eliminación:", error);
    }
}
