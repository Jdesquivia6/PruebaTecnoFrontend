const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");

function registerFunction() {
    loginForm.style.left = "-50%";
    loginForm.style.opacity = 0;
    registerForm.style.left = "50%";
    registerForm.style.opacity = 1;
    wrapper.style.height = "450px";
    wrapper.style.width = "500px";
    loginTitle.style.top = "-60px";
    loginTitle.style.opacity = 0;
    registerTitle.style.top = "50%";
    registerTitle.style.opacity = 1;
}

function loginFunction() {
    loginForm.style.left = "50%";
    loginForm.style.opacity = 1;
    registerForm.style.left = "190%";
    registerForm.style.opacity = 0;
    wrapper.style.height = "500px";
    loginTitle.style.top = "50%";
    loginTitle.style.opacity = 1;
    registerTitle.style.top = "50px";
    registerTitle.style.opacity = 0;
}

document.addEventListener("DOMContentLoaded", function () {
    const signUpBtn = document.getElementById("SignUpBtn");

    function limpiarFormulario() {
        document.getElementById("reg-name").value = "";
        document.getElementById("reg-pass").value = "";
    }

    signUpBtn.addEventListener("click", async function (event) {
        event.preventDefault(); 

        const username = document.getElementById("reg-name").value.trim();
        const password = document.getElementById("reg-pass").value.trim();

        if (!username || !password) {
            alert("Por favor, completa todos los campos.", "danger");
            return;
        }

        const userData = {
            username,
            password
        };

        try {
            const response = await fetch("http://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/registroUsuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error en el registro");
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            alert("Registro exitoso! ", "success");

            limpiarFormulario();
            setTimeout(() => {
                window.location.href = "/views/login.html";
            }, 2000);
        } catch (error) {
            alert(`Error: ${error.message}`, "danger");
        }
    });
});



signInBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    const username = document.getElementById("log-username").value.trim();
    const password = document.getElementById("log-pass").value.trim();

    if (!username || !password) {
        alert("Por favor, completa todos los campos.", "danger");
        return;
    }

    console.log(username, "separador" , password);
    

    try {
        const response = await fetch("http://ec2-3-137-140-201.us-east-2.compute.amazonaws.com:8000/api/v1/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Error en la autenticación");
        }

        localStorage.setItem("token", data.token);
        alert("Inicio de sesión exitoso! Redirigiendo...", "success");

        setTimeout(() => {
            window.location.href = "/views/empleados.html";
        }, 2000);
    } catch (error) {
        alert(`Error: ${error.message}`, "danger");
    }
});
