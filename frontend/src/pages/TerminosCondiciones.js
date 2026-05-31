import React from "react";
import Layout from "../components/Layout";
import "./LegalPage.css";
import { HiDocumentText } from "react-icons/hi";


function TerminosCondiciones() {
  return (
    <Layout>
      <div className="legal-page">
        <section className="legal-hero">
          <div className="legal-hero-content">
            <div className="legal-hero-icono">
              <HiDocumentText />
            </div>
            <h1 className="legal-hero-titulo">Términos y Condiciones</h1>
            <p className="legal-hero-sub">Última actualización: Mayo 2026</p>
          </div>
        </section>

        <div className="legal-documento">
          <p className="legal-intro-texto">
            El presente documento establece los términos y condiciones bajo los
            cuales se regula el uso de la plataforma EventosMX. Al acceder,
            navegar o utilizar el sitio, tanto clientes como proveedores aceptan
            cumplir con lo establecido. En caso de no estar de acuerdo, el
            usuario deberá abstenerse de utilizar la plataforma.
          </p>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">1. Descripción de la Plataforma</h2>
            <p>
              EventosMX es una plataforma digital diseñada para centralizar la
              contratación de servicios para todo tipo de eventos: bodas,
              cumpleaños, conferencias, graduaciones, aniversarios, fiestas
              corporativas y más. El servicio está dirigido a personas mayores
              de 18 años.
            </p>
            <h3 className="legal-doc-h3">1.1 Clientes</h3>
            <p>
              Pueden buscar, comparar y contratar servicios de distintos
              proveedores desde un mismo lugar.
            </p>
            <h3 className="legal-doc-h3">1.2 Proveedores</h3>
            <p>
              Pueden registrar su negocio, mostrar sus servicios, gestionar
              cotizaciones, administrar su calendario y publicar promociones.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">2. Uso del Servicio</h2>
            <p>
              El usuario se compromete a utilizar la plataforma de manera
              adecuada. Queda expresamente prohibido:
            </p>
            <ul className="legal-doc-lista">
              <li>
                Utilizar la plataforma para fines fraudulentos o ilegales.
              </li>
              <li>Publicar contenido falso o engañoso.</li>
              <li>
                Intentar acceder de manera no autorizada a cuentas ajenas o al
                sistema.
              </li>
              <li>
                Reproducir o distribuir elementos de la plataforma sin
                autorización.
              </li>
            </ul>
            <p>
              El usuario es responsable de todas las acciones realizadas desde
              su cuenta.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">3. Registro de Cuentas</h2>
            <h3 className="legal-doc-h3">3.1 Clientes</h3>
            <p>
              Para acceder a las funcionalidades de búsqueda y contratación, el
              cliente deberá registrarse con información verídica: nombre,
              correo electrónico, contraseña y teléfono. El cliente es
              responsable de mantener la confidencialidad de sus datos de
              acceso.
            </p>
            <h3 className="legal-doc-h3">3.2 Proveedores</h3>
            <p>
              Los proveedores deberán registrar su negocio con nombre, correo
              corporativo, teléfono, ciudad y tipo de servicio. El acceso al
              panel de proveedor requiere aprobación previa por parte del
              administrador.
            </p>
            <p>
              EventosMX se reserva el derecho de suspender o eliminar cuentas
              que presenten información falsa o incumplan estos términos.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">4. Solicitudes y Cotizaciones</h2>
            <p>
              Los clientes podrán enviar solicitudes de cotización
              personalizadas especificando fecha del evento, tipo de servicio,
              número de invitados y presupuesto estimado. Los proveedores podrán
              responder, aceptar o rechazar dichas solicitudes desde su panel.
            </p>
            <p>
              EventosMX actúa únicamente como intermediario digital. La
              plataforma no garantiza la disponibilidad de ningún proveedor ni
              es parte del contrato que se formalice entre las partes.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">5. Comunicación y Confirmación</h2>
            <p>
              La plataforma incluye un sistema de chat integrado para la
              comunicación directa entre clientes y proveedores. Una vez que
              ambas partes acuerden los términos, el sistema enviará
              automáticamente un correo de confirmación con los detalles del
              servicio.
            </p>
            <p>
              Este correo funciona como comprobante del acuerdo dentro de la
              plataforma y no constituye un contrato legalmente vinculante por
              sí mismo.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">6. Calificaciones y Reseñas</h2>
            <p>
              Una vez concluido el evento, los clientes podrán calificar y dejar
              reseñas sobre los servicios contratados. Los proveedores podrán
              responder públicamente. EventosMX utiliza análisis de sentimiento
              automático para clasificar las reseñas.
            </p>
            <p>
              La plataforma se reserva el derecho de eliminar reseñas con
              contenido ofensivo, inapropiado o falso, previa revisión del
              administrador.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">7. Cancelación y Reembolso</h2>
            <p>
              Dado que EventosMX es una plataforma de intermediación y no
              procesa pagos directamente, las condiciones de cancelación y
              reembolso dependen del acuerdo entre cliente y proveedor.
              EventosMX podrá intervenir como mediador en los siguientes casos:
            </p>
            <ul className="legal-doc-lista">
              <li>Servicio no prestado por causas atribuibles al proveedor.</li>
              <li>
                Diferencia significativa entre el servicio acordado y el
                entregado.
              </li>
              <li>
                Error demostrable en la comunicación registrada en la
                plataforma.
              </li>
            </ul>
            <p>
              Para solicitar mediación, contáctanos el mismo día del incidente
              con la información del servicio y descripción del problema.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">8. Límites de Responsabilidad</h2>
            <p>
              EventosMX no garantiza la disponibilidad continua del servicio
              ante interrupciones por mantenimiento, fallas técnicas o fuerza
              mayor. La plataforma no es responsable por la calidad o resultado
              de los servicios contratados entre clientes y proveedores.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">9. Propiedad Intelectual</h2>
            <p>
              Todos los elementos de la plataforma —diseño, logotipos, textos y
              algoritmos— son propiedad del equipo de EventosMX. Queda prohibida
              su reproducción sin autorización previa y por escrito.
            </p>
            <p>
              El contenido publicado por los proveedores en sus perfiles es
              responsabilidad exclusiva de ellos. Al subirlo, declaran contar
              con los derechos necesarios para su uso en la plataforma.
            </p>
          </section>

          <section className="legal-doc-seccion">
            <h2 className="legal-doc-h2">10. Modificación de los Términos</h2>
            <p>
              EventosMX se reserva el derecho de modificar estos términos en
              cualquier momento. Los cambios entrarán en vigor al publicarse en
              la plataforma, y se notificará a los usuarios registrados por
              correo electrónico.
            </p>
            <p>
              El presente documento se rige por las leyes de los Estados Unidos
              Mexicanos. Cualquier controversia será resuelta ante las
              autoridades competentes en Guadalajara, Jalisco.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default TerminosCondiciones;
