import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import "./QuienesSomos.css";

// React Icons imports
import { MdCelebration } from "react-icons/md";
import { FaSearch, FaFileInvoiceDollar, FaComments, FaGlassCheers } from "react-icons/fa";
import { FaUserCircle, FaBriefcase } from "react-icons/fa";
import { FaHandshake, FaBolt, FaMagnifyingGlass } from "react-icons/fa6";
import { GiMexico } from "react-icons/gi";

function QuienesSomos() {
  return (
    <Layout>
      <div className="qs-page">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="qs-hero">
          <div className="qs-hero-content">
            <h1 className="qs-hero-titulo">
              Organizar tu evento nunca había sido tan fácil
            </h1>
            <p className="qs-hero-subtitulo">
              EventosMX nació para que encuentres al proveedor perfecto
              sin llamadas interminables, sin visitar diez páginas distintas
              y sin perder tiempo valioso.
            </p>
          </div>
        </section>

        {/* ── Historia / por qué existimos ──────────────────────────── */}
        <section className="qs-seccion qs-seccion-clara">
          <div className="qs-contenido qs-dos-columnas">
            <div className="qs-columna-texto">
              <h2 className="qs-titulo-seccion qs-titulo-izq">
                ¿Por qué existe EventosMX?
              </h2>
              <p className="qs-parrafo qs-parrafo-izq">
                Organizar un evento en México puede ser frustrante. Buscas en
                grupos de Facebook, pides recomendaciones por WhatsApp, llamas
                a proveedores que no contestan, y al final no sabes si el precio
                que te dieron es justo.
              </p>
              <p className="qs-parrafo qs-parrafo-izq">
                EventosMX existe para cambiar eso. Reunimos en un solo lugar a
                los mejores fotógrafos, salones, caterers, animadores y más —
                para que tú compares, cotices y contrates con confianza y sin
                complicaciones.
              </p>
            </div>
            <div className="qs-columna-imagen">
              <div className="qs-imagen-decorativa">
                <MdCelebration />
              </div>
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ─────────────────────────────────────────── */}
        <section className="qs-seccion qs-seccion-oscura">
          <div className="qs-contenido">
            <h2 className="qs-titulo-seccion qs-titulo-blanco">
              Así de simple funciona
            </h2>
            <div className="qs-pasos">
              {[
                {
                  paso: "01",
                  icono: <FaSearch />,
                  titulo: "Busca",
                  texto: "Filtra por ciudad, tipo de evento y presupuesto. Encuentra exactamente lo que necesitas.",
                },
                {
                  paso: "02",
                  icono: <FaFileInvoiceDollar />,
                  titulo: "Cotiza",
                  texto: "Envía tu solicitud directamente al proveedor. Recibe su propuesta sin intermediarios.",
                },
                {
                  paso: "03",
                  icono: <FaComments />,
                  titulo: "Habla",
                  texto: "Chatea con el proveedor, aclara dudas y llega a un acuerdo desde la plataforma.",
                },
                {
                  paso: "04",
                  icono: <FaGlassCheers />,
                  titulo: "Disfruta",
                  texto: "Confirma el servicio y recibe un comprobante automático por correo. Listo.",
                },
              ].map((p) => (
                <div className="qs-paso" key={p.paso}>
                  <div className="qs-paso-num">{p.paso}</div>
                  <div className="qs-paso-icono">{p.icono}</div>
                  <h3 className="qs-paso-titulo">{p.titulo}</h3>
                  <p className="qs-paso-texto">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Para quién es ─────────────────────────────────────────── */}
        <section className="qs-seccion qs-seccion-clara">
          <div className="qs-contenido">
            <h2 className="qs-titulo-seccion">Para quién es EventosMX</h2>
            <div className="qs-audiencia-grid">
              <div className="qs-audiencia-card">
                <div className="qs-audiencia-icono">
                  <FaUserCircle />
                </div>
                <h3>Para clientes</h3>
                <p>
                  Si organizas bodas, cumpleaños, graduaciones o cualquier
                  celebración, aquí encuentras proveedores reales con reseñas
                  verificadas, precios claros y comunicación directa.
                </p>
                <Link to="/register" className="qs-audiencia-btn">
                  Crear cuenta gratis
                </Link>
              </div>
              <div className="qs-audiencia-card qs-audiencia-card--destacado">
                <div className="qs-audiencia-icono">
                  <FaBriefcase />
                </div>
                <h3>Para proveedores</h3>
                <p>
                  Si ofreces servicios para eventos, EventosMX te da visibilidad
                  frente a cientos de clientes potenciales. Gestiona
                  solicitudes, publica promociones y haz crecer tu negocio.
                </p>
                <Link to="/register-proveedor" className="qs-audiencia-btn qs-audiencia-btn--oscuro">
                  Registrar mi negocio
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Valores ───────────────────────────────────────────────── */}
        <section className="qs-seccion qs-seccion-oscura">
          <div className="qs-contenido">
            <h2 className="qs-titulo-seccion qs-titulo-blanco">
              Lo que nos importa
            </h2>
            <div className="qs-valores-grid">
              {[
                { icono: <FaHandshake />, titulo: "Confianza", texto: "Reseñas reales, proveedores verificados y comunicación transparente." },
                { icono: <FaBolt />, titulo: "Rapidez", texto: "Menos tiempo buscando, más tiempo disfrutando lo que importa." },
                { icono: <FaMagnifyingGlass />, titulo: "Transparencia", texto: "Precios claros, sin sorpresas ni comisiones ocultas." },
                { icono: <GiMexico />, titulo: "Hecho en México", texto: "Diseñado para la cultura y el ritmo de los eventos en México." },
              ].map((v, i) => (
                <div className="qs-valor-card" key={i}>
                  <div className="qs-valor-icono">{v.icono}</div>
                  <h3 className="qs-valor-titulo">{v.titulo}</h3>
                  <p className="qs-valor-texto">{v.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ─────────────────────────────────────────────── */}
        <section className="qs-seccion qs-seccion-clara qs-cta">
          <div className="qs-contenido qs-centrado">
            <h2 className="qs-titulo-seccion">
              Tu próximo evento empieza aquí
            </h2>
            <p className="qs-parrafo">
              Únete a EventosMX y descubre por qué cada vez más personas en
              Guadalajara confían en nosotros para hacer realidad sus eventos.
            </p>
            <div className="qs-cta-botones">
              <Link to="/" className="qs-cta-btn qs-cta-btn--primario">
                Explorar proveedores
              </Link>
              <Link to="/register" className="qs-cta-btn qs-cta-btn--secundario">
                Crear mi cuenta
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}

export default QuienesSomos;