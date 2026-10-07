'use client';
/* Local original ultrasound images intentionally bypass remote image optimization. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Heart,
  Pause,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ParticleObject } from '@/components/canvasui/ParticleObject';
import memories from '@/lib/memories.json';
import { Switch } from '@/components/ui/switch';
import {
  measurements,
  regionLabels,
  type BodyRegion,
} from '@/lib/measurements';
const chapters = [
  {
    id: 'mayo',
    label: 'Mayo',
    reference: 4,
    scale: 1.65,
    caption: 'Nuestro pequeño frijolito',
    note: 'Una forma pequeña y curvada, inspirada en la ecografía del 22 de mayo.',
  },
  {
    id: 'junio',
    label: 'Junio',
    reference: 11,
    scale: 2.35,
    caption: 'Un poquito más de ti',
    note: 'Un cuerpo recogido y una manito levantada, tomando como referencia esta ecografía de junio.',
  },
  {
    id: 'julio',
    label: 'Julio',
    reference: 0,
    scale: 2.85,
    caption: 'Ya imaginamos tu carita',
    note: 'El perfil recostado y las piernas flexionadas de la fotografía de julio inspiran esta postura.',
  },
  {
    id: 'agosto',
    label: 'Agosto',
    reference: 17,
    scale: 3.3,
    caption: 'Aquí contigo, Alessa',
    note: 'Las extremidades más largas y flexionadas de las ecografías de agosto inspiran esta figura.',
  },
];
export default function Home() {
  const referenceToggleRef = useRef<HTMLButtonElement>(null);
  const referencePanelRef = useRef<HTMLElement>(null);
  const measurePanelRef = useRef<HTMLElement>(null);
  const thumbnailsRef = useRef<HTMLElement>(null);
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [settled, setSettled] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [solid, setSolid] = useState(false);
  const [month, setMonth] = useState('agosto'),
    [photo, setPhoto] = useState(17),
    [rotate, setRotate] = useState(false),
    [distance, setDistance] = useState(4.5),
    [reset, setReset] = useState(0),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [reference, setReference] = useState(false);
  const chapter = chapters.find((c) => c.id === month)!;
  const photos = memories[month as keyof typeof memories];
  const study = measurements[month];
  const regionOptions: BodyRegion[] =
    month === 'mayo' ? ['whole'] : ['head', 'abdomen', 'arms', 'legs'];
  const details = region ? (study.regions[region] ?? []) : [];
  const measurePanelOpen =
    showMeasurements && region !== null && settled && !failed;

  function closeReference() {
    setReference(false);
    referenceToggleRef.current?.focus({ preventScroll: true });
  }

  function closeMeasurements() {
    setRegion(null);
    setShowMeasurements(false);
    document
      .getElementById('measurements-switch')
      ?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const strip = thumbnailsRef.current;
    const active = strip?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    if (!strip || !active) return;
    strip.scrollTo({
      left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2,
      behavior: 'instant',
    });
  }, [month, photo]);

  useEffect(() => {
    if (!reference && !measurePanelOpen) return;
    const panel = reference
      ? referencePanelRef.current
      : measurePanelRef.current;
    panel?.focus({ preventScroll: true });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (reference) closeReference();
      else closeMeasurements();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [reference, measurePanelOpen]);

  function selectMonth(id: string) {
    if (id === month) return;
    const next = chapters.find((c) => c.id === id)!;
    setRegion(showMeasurements ? (id === 'mayo' ? 'whole' : 'head') : null);
    setSettled(false);
    setMonth(id);
    setPhoto(next.reference);
    setFailed(false);
    setReady(false);
  }
  return (
    <main id="inicio">
      <a href="#recuerdos" className="skip-link">
        Ir al álbum de ecografías
      </a>
      <section
        className="immersive"
        aria-label="Dentro de nuestro pequeño universo"
      >
        <div className="scene-layer">
          {!failed ? (
            <ParticleObject
              key={`${reset}-particles-morph-v1`}
              className="particle-scene"
              ariaLabel={`Interpretación artística 3D de Alessa en ${chapter.label.toLowerCase()}`}
              src={`/models/${month}.gltf?v=3`}
              count={28000}
              transitionDuration={3.6}
              size={1.65}
              sizeVariance={0.7}
              color="#ffffff"
              scale={chapter.scale}
              cameraDistance={distance}
              fov={48}
              yOffset={-0.2}
              floatIntensity={0.28}
              rotationIntensity={0.18}
              floatSpeed={0.65}
              drift={0.35}
              strength={0}
              radius={55}
              spring={3}
              damping={0.8}
              orbit
              zoom
              autoRotate={rotate}
              autoRotateSpeed={0.45}
              womb
              surface={solid}
              onRegion={
                showMeasurements
                  ? (next) => {
                      setRegion(next);
                      setReference(false);
                    }
                  : null
              }
              onSettled={setSettled}
              onLoad={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="fallback">
              <img
                src={photos[chapter.reference]}
                alt={`Ecografía de ${chapter.label}`}
              />
              <p>El visor 3D no está disponible en este dispositivo.</p>
              <button
                onClick={() => {
                  setFailed(false);
                  setReady(false);
                  setReset((v) => v + 1);
                }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
        <div className="vignette" aria-hidden="true" />
        <header className="masthead">
          <a href="#inicio" className="wordmark">
            alessa<span aria-hidden="true">✳</span>
          </a>
          <span className="announcement">VAMOS A SER PAPÁS</span>
          <a href="#recuerdos" className="album-link">
            Nuestro álbum <ArrowDown size={15} aria-hidden="true" />
          </a>
        </header>
        <div className="scene-title">
          <h1>
            Hola, <em>Alessa.</em>
          </h1>
        </div>
        <div className="scene-caption" aria-live="polite">
          <span>{chapter.label} · 2026</span>
          <p>{chapter.caption}</p>
        </div>
        <button
          ref={referenceToggleRef}
          className={`reference-toggle ${reference ? 'active' : ''}`}
          aria-expanded={reference}
          aria-controls={reference ? 'scan-reference' : undefined}
          onClick={() => {
            setReference((v) => !v);
            setRegion(null);
            setShowMeasurements(false);
          }}
        >
          <img src={photos[chapter.reference]} alt="" />
          <span>
            Su ecografía
            <small>{reference ? 'Cerrar referencia' : 'Ver referencia'}</small>
          </span>
          {reference ? (
            <X size={16} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} aria-hidden="true" />
          )}
        </button>
        {reference && (
          <aside
            ref={referencePanelRef}
            tabIndex={-1}
            className="reference-panel"
            id="scan-reference"
            aria-label={`Referencia de ${chapter.label}`}
          >
            <div>
              <span>{chapter.label} · Imagen de referencia</span>
              <button aria-label="Cerrar referencia" onClick={closeReference}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <img
              src={photos[chapter.reference]}
              alt={`Ecografía original de ${chapter.label} que inspira la figura`}
            />
            <p>{chapter.note}</p>
            <small>
              El volumen y las partes ocultas son una interpretación artística.
            </small>
          </aside>
        )}
        {measurePanelOpen && region && (
          <aside
            ref={measurePanelRef}
            tabIndex={-1}
            id="scan-measurements"
            className="measure-panel"
            aria-label="Medidas de su ecografía"
          >
            <div className="measure-heading">
              <span>DETALLES DE SU ECO · {chapter.label}</span>
              <button aria-label="Cerrar medidas" onClick={closeMeasurements}>
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <nav className="region-tabs" aria-label="Consultar parte del bebé">
              {regionOptions.map((id) => (
                <button
                  key={id}
                  aria-pressed={region === id}
                  onClick={() => setRegion(id)}
                >
                  {regionLabels[id]}
                </button>
              ))}
            </nav>
            <div aria-live="polite" aria-atomic="true">
              <h2>{regionLabels[region]}</h2>
              <p className="measure-date">{study.date}</p>
              {details.length ? (
                <dl>
                  {details.map((item) => (
                    <div className="measure-item" key={item.code}>
                      <dt>
                        {item.label} <abbr title={item.label}>{item.code}</abbr>
                      </dt>
                      <dd>
                        <span className="measure-value">{item.value}</span>
                        <p>{item.description}</p>
                        <a
                          href="#recuerdos"
                          onClick={() => setPhoto(item.photo - 1)}
                        >
                          Ver ecografía {String(item.photo).padStart(2, '0')}{' '}
                          <ArrowRight size={13} aria-hidden="true" />
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="measure-empty">
                  No hay una medida legible registrada para esta zona en las
                  imágenes de {chapter.label.toLowerCase()}.
                </p>
              )}
            </div>
            <small>
              Datos de las fotos originales. La ubicación en el 3D es
              orientativa.
            </small>
          </aside>
        )}
        {!ready && !failed && (
          <output className="loading" aria-live="polite">
            Entrando en su pequeño mundo…
          </output>
        )}
        <div className="interaction-bar">
          <p className="orbit-hint" id="viewer-instructions">
            {showMeasurements
              ? 'Arrastra para girar · Señala o toca para ver sus medidas'
              : 'Arrastra para girar · Pellizca para acercar'}
          </p>
          <fieldset className="controls">
            <legend className="sr-only">Controles del visor 3D</legend>
            <fieldset className="view-modes">
              <legend className="sr-only">Aspecto del bebé</legend>
              <button
                disabled={failed}
                aria-pressed={!solid}
                onClick={() => setSolid(false)}
              >
                Partículas
              </button>
              <button
                disabled={failed}
                aria-pressed={solid}
                onClick={() => setSolid(true)}
              >
                Sólido
              </button>
            </fieldset>
            <label className="measure-toggle" htmlFor="measurements-switch">
              <span>Medidas</span>
              <Switch
                id="measurements-switch"
                aria-controls={
                  measurePanelOpen ? 'scan-measurements' : undefined
                }
                checked={showMeasurements}
                disabled={!settled || failed}
                onCheckedChange={(checked) => {
                  setShowMeasurements(checked);
                  setRegion(checked ? regionOptions[0] : null);
                  if (checked) setReference(false);
                }}
              />
            </label>
            <div className="icon-controls">
              <button
                aria-label="Acercar"
                title="Acercar"
                disabled={failed || distance <= 2.5}
                onClick={() => setDistance((v) => Math.max(2.5, v - 0.5))}
              >
                <ZoomIn size={17} aria-hidden="true" />
              </button>
              <button
                aria-label="Alejar"
                title="Alejar"
                disabled={failed || distance >= 7}
                onClick={() => setDistance((v) => Math.min(7, v + 0.5))}
              >
                <ZoomOut size={17} aria-hidden="true" />
              </button>
              <button
                aria-label={rotate ? 'Pausar giro' : 'Girar automáticamente'}
                aria-pressed={rotate}
                title="Giro automático"
                disabled={failed}
                onClick={() => {
                  setRotate((v) => !v);
                }}
              >
                {rotate ? (
                  <Pause size={16} aria-hidden="true" />
                ) : (
                  <Play size={16} aria-hidden="true" />
                )}
              </button>
              <button
                aria-label="Restablecer vista"
                title="Restablecer vista"
                disabled={failed}
                onClick={() => {
                  setRegion(showMeasurements ? regionOptions[0] : null);
                  setSettled(false);
                  setDistance(4.5);
                  setRotate(false);
                  setReset((v) => v + 1);
                  setReady(false);
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
            </div>
          </fieldset>
        </div>
        <nav className="month-selector" aria-label="Seleccionar mes">
          {chapters.map((c) => (
            <button
              key={c.id}
              className={month === c.id ? 'selected' : ''}
              aria-pressed={month === c.id}
              onClick={() => selectMonth(c.id)}
            >
              <span aria-hidden="true" />
              {c.label}
            </button>
          ))}
        </nav>
        <span className="art-label">
          Experiencia artística inspirada en sus ecografías
        </span>
      </section>
      <section
        id="recuerdos"
        className="memories"
        tabIndex={-1}
        aria-labelledby="memories-title"
      >
        <div className="memories-copy">
          <h2 id="memories-title">
            Antes de abrazarte,
            <br />
            <em>ya te mirábamos así.</em>
          </h2>
          <p>
            {chapter.label} · {photos.length} ecografías
          </p>
          <div className="gallery-nav">
            <button
              aria-label="Ecografía anterior"
              onClick={() =>
                setPhoto((v) => (v - 1 + photos.length) % photos.length)
              }
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <span aria-live="polite">
              {String(photo + 1).padStart(2, '0')} /{' '}
              {String(photos.length).padStart(2, '0')}
            </span>
            <button
              aria-label="Ecografía siguiente"
              onClick={() => setPhoto((v) => (v + 1) % photos.length)}
            >
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="art-explanation">
            Las imágenes son nuestras ecografías originales. La figura 3D
            interpreta la silueta de cada etapa; no reconstruye el cuerpo real
            de Alessa.
          </p>
        </div>
        <div className="gallery">
          <img
            className="main-echo"
            src={photos[photo]}
            alt={`Ecografía original de ${chapter.label}, imagen ${photo + 1}`}
            loading="lazy"
          />
          <nav
            className="thumbnails"
            ref={thumbnailsRef}
            aria-label={`Ecografías de ${chapter.label.toLowerCase()}`}
          >
            {photos.map((src, i) => (
              <button
                key={src}
                className={photo === i ? 'active' : ''}
                aria-label={`Ver ecografía ${i + 1}`}
                aria-pressed={photo === i}
                onClick={() => setPhoto(i)}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </nav>
        </div>
      </section>
      <footer>
        <span className="wordmark">
          alessa<span aria-hidden="true">✳</span>
        </span>
        <p>Te esperamos con todo el amor del mundo.</p>
        <Heart size={17} aria-hidden="true" />
      </footer>
    </main>
  );
}
