import React from "react";
import Layout from "../components/Layout";
import "./LegalPage.css";
import { MdPrivacyTip } from "react-icons/md";



function AvisoPrivacidad() {
  return (
    <Layout>
      <div className="legal-page">

        <section className="legal-hero">
          <div className="legal-hero-content">
<div className="legal-hero-icono">
  <MdPrivacyTip />
</div>            <h1 className="legal-hero-titulo">Aviso de Privacidad</h1>
            <p className="legal-hero-sub">Última actualización: Mayo 2026</p>
          </div>
        </section>

        <div className="legal-documento">

          <p className="legal-intro-texto">
            En cumplimiento con la Ley Federal de Protección de Datos Personales
            en Posesión de los Particulares (LFPDPPP), EventosMX informa a sus
            usuarios sobre el tratamiento de sus datos personales.
          </p>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">1. Identidad del Responsable</h2>
            <p>
              El responsable del tratamiento de sus datos personales es el equipo
              de la plataforma EventosMX, con domicilio en Guadalajara, Jalisco,
              México. Somos encargados de recabar, usar, proteger y dar
              tratamiento a su información conforme a las disposiciones legales
              aplicables.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">2. Datos Personales Tratados</h2>
            <p>
              EventosMX recaba los siguientes datos según el tipo de usuario:
            </p>
            <h3 className="legal-doc-h3">2.1 Clientes</h3>
            <ul className="legal-doc-lista">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número telefónico</li>
              <li>Ciudad o ubicación de referencia</li>
              <li>Preferencias de eventos y presupuesto (opcional)</li>
              <li>Historial de solicitudes y cotizaciones</li>
            </ul>
            <h3 className="legal-doc-h3">2.2 Proveedores</h3>
            <ul className="legal-doc-lista">
              <li>Nombre del negocio y del representante</li>
              <li>Correo electrónico corporativo</li>
              <li>Número telefónico de contacto</li>
              <li>Ciudad y zonas de cobertura</li>
              <li>Tipo de servicio ofrecido</li>
              <li>Logotipos, fotografías e información pública del negocio</li>
              <li>Calendario de disponibilidad</li>
            </ul>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">3. Finalidad del Tratamiento</h2>
            <p>Los datos recabados se utilizarán para las siguientes finalidades primarias:</p>
            <ul className="legal-doc-lista">
              <li>Crear y administrar cuentas de usuarios.</li>
              <li>Facilitar la búsqueda, comparación y contratación de servicios.</li>
              <li>Procesar solicitudes y gestionar la comunicación entre partes.</li>
              <li>Enviar confirmaciones automáticas por correo electrónico.</li>
              <li>Generar recomendaciones personalizadas.</li>
              <li>Analizar reseñas y calificaciones para garantizar la calidad.</li>
              <li>Administrar el calendario de disponibilidad de proveedores.</li>
              <li>Brindar atención a clientes y moderar contenido.</li>
            </ul>
            <p>
              De manera secundaria y no vinculante, los datos podrán usarse para
              envío de novedades o promociones de la plataforma. El usuario puede
              oponerse en cualquier momento.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">4. Medidas de Seguridad</h2>
            <p>
              EventosMX implementa las siguientes medidas para proteger su
              información:
            </p>
            <ul className="legal-doc-lista">
              <li>Protocolo seguro HTTPS en toda la plataforma.</li>
              <li>Almacenamiento cifrado de contraseñas mediante hash (bcrypt).</li>
              <li>Autenticación con tokens JWT.</li>
              <li>Acceso a datos restringido por rol de usuario.</li>
              <li>Validación y saneamiento de datos en el servidor.</li>
              <li>Copias de seguridad periódicas en la base de datos PostgreSQL.</li>
            </ul>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">5. Derechos ARCO</h2>
            <p>
              En todo momento puede ejercer sus derechos ARCO:
            </p>
            <ul className="legal-doc-lista">
              <li><strong>Acceso:</strong> conocer qué datos tenemos y cómo los usamos.</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos o incompletos.</li>
              <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos.</li>
              <li><strong>Oposición:</strong> negarse al tratamiento para finalidades específicas.</li>
            </ul>
            <p>
              Para ejercer sus derechos, envíe una solicitud a través de la
              opción <strong>Contáctanos</strong> en el pie de página, incluyendo
              su nombre completo, documento de identidad y descripción del
              derecho que desea ejercer. EventosMX responderá en un plazo máximo
              de 20 días hábiles.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">6. Uso de Cookies</h2>
            <p>
              La plataforma puede utilizar cookies y tecnologías similares para
              mejorar la experiencia de navegación y recordar preferencias. El
              usuario puede deshabilitar las cookies desde la configuración de su
              navegador, aunque esto podría afectar algunas funcionalidades del
              sitio.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">7. Modificaciones al Aviso</h2>
            <p>
              Este aviso podrá actualizarse para atender cambios legales o de
              servicio. Notificaremos las modificaciones a través de la
              plataforma. Se recomienda revisarlo periódicamente.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">8. Aceptación</h2>
            <p>
              Al proporcionar sus datos y utilizar la plataforma EventosMX,
              usted acepta el tratamiento de su información conforme a los
              términos del presente aviso de privacidad.
            </p>
          </section>

        </div>
      </div>
    </Layout>
  );
}

export default AvisoPrivacidad;