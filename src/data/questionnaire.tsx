import type { QuestionnaireQuestion } from '@/types/questionnaire'
import {
  Addiction,
  AddictionFrequency,
  SupplementHowOften,
  SupplementUnit,
} from '@/types/form-cuerpo-fit'

export const questionnaireClarification = (
  <div className="space-y-4 text-sm leading-relaxed text-justify">
    <p>
      Antes de empezar, necesitás saber que este cuestionario define si podemos trabajar
      juntos.
    </p>
    <p className="text-lg font-bold">
      Respondé con total honestidad y reservá 10-12 minutos sin interrupciones.
    </p>
    <p>
      Si en algún momento no cumplís con una consigna (como disponibilidad inmediata,
      una lesión sin tratar o no tener claro tu objetivo), podés detenerte y volver cuando
      estés listo. Prefiero que llegues cuando sea tu momento real.
    </p>
    <p>
      Al finalizar vas a recibir un link directo a mi Whatsapp para enviarme el video de
      evaluación corporal y coordinar tu plan personalizado.
    </p>
  </div>
)

export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'time_commitment',
    title: '¿Tenés realmente el tiempo en tu día para enfocarte en esto?',
    category: 'compromiso',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'time_yes',
        text: '¡Sí! Tengo tiempo para entrenar y para mejorar mis comidas 💪🏼',
        value: 2,
      },
      {
        id: 'time_no',
        text: 'No tengo tiempo para esto, así que no contestaré este formulario',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
  {
    id: 'start_now',
    title:
      '¿Podés empezar hoy o mañana mismo tu cambio físico (entrenamiento, comidas, y demás) con mi ayuda, paso a paso?',
    category: 'compromiso',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'start_yes',
        text: 'Sí Ripo, puedo empezar hoy/mañana mismo 💪🏼',
        value: 2,
      },
      {
        id: 'start_no',
        text: 'No puedo empezar ni hoy ni mañana mismo, así que no contestaré este formulario todavía',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
  {
    id: 'injury',
    title:
      '¿Tenés HOY alguna lesión o limitación que te impida realizar ejercicio y no esté curada o tratada?',
    category: 'salud',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'injury_none',
        text: 'No, hoy no tengo nada que me impida hacer ejercicio 😉',
        value: 3,
      },
      {
        id: 'injury_yes',
        text: 'Sí tengo una lesión o limitación, así que contestaré este formulario cuando me recupere 💪🏼',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
  {
    id: 'health_conditions',
    title: '¿Tenés HOY alguna de estas condiciones?',
    category: 'salud',
    required: true,
    type: 'multi-choice',
    answers: [
      { id: 'cond_diabetes', text: 'Diabetes tipo 1 o 2' },
      { id: 'cond_hypo', text: 'Hipotiroidismo' },
      { id: 'cond_hyper', text: 'Hipertiroidismo' },
      { id: 'cond_hypertension', text: 'Hipertensión' },
      { id: 'cond_hypotension', text: 'Hipotensión' },
      { id: 'cond_litiasis', text: 'Litiasis Vesicular' },
      { id: 'cond_anemia', text: 'Anemia' },
      { id: 'cond_infection', text: 'Infección urinaria o de algún tipo' },
      { id: 'cond_none', text: 'No tengo ninguna 😉', value: 3 },
      { id: 'cond_other', text: 'Otro' },
    ],
    clarification:
      'Seleccioná todas las que correspondan. Si completás "Otro", detallalo en la siguiente pregunta.',
  },
  {
    id: 'health_conditions_other_detail',
    title: 'Otro (Condiciones actuales)',
    category: 'salud',
    type: 'text',
    placeholder: 'Ej: Tengo asma leve controlada',
  },
  {
    id: 'treatment',
    title: 'Si tenés alguna condición de las anteriores, ¿estás con tratamiento?',
    category: 'salud',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'treatment_yes',
        text: 'Sí Ripo, estoy en tratamiento para recuperarme/mantenerme sano con mi condición ✅',
        value: 2,
      },
      {
        id: 'treatment_no',
        text: 'Todavía no, así que contestaré este formulario cuando esté recuperado/en tratamiento 💪🏼',
        value: 0,
        blocksProgress: true,
      },
      {
        id: 'treatment_none',
        text: 'Ripo, te dije que no tengo ninguna condición. Dejame contestar el formulario en paz 😂',
        value: 2,
      },
    ],
  },
  {
    id: 'answers_confidence',
    title: '¿Estás seguro de que respondiste bien las anteriores preguntas?',
    category: 'compromiso',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'answers_confident', text: 'Sí Ripo, revisé y respondí todo muy bien 💪🏼', value: 2 },
      {
        id: 'answers_not_sure',
        text: 'No revisé, por lo que no voy a continuar este formulario',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
  {
    id: 'full_name',
    title: '¿Tu Nombre y tu Apellido?',
    category: 'datos',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: Joaquin Ripoli',
  },
  {
    id: 'gender',
    title: '¿Género?',
    category: 'datos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'gender_male', text: 'Hombre', value: 1 },
      { id: 'gender_female', text: 'Mujer', value: 1 },
    ],
  },
  {
    id: 'age',
    title: '¿Cuántos años tenés?',
    category: 'datos',
    required: true,
    type: 'number',
    placeholder: 'Sólo el número, ejemplo: 30',
  },
  {
    id: 'height',
    title: '¿Cuánto medís en centímetros?',
    category: 'datos',
    required: true,
    type: 'number',
    placeholder: 'Ejemplo: 178',
    helperText: 'Ingresá sólo el número',
  },
  {
    id: 'weight',
    title: '¿Cuánto pesás en kilogramos?',
    category: 'datos',
    required: true,
    type: 'number',
    placeholder: 'Ejemplo: 80.5',
    helperText: 'Si no sabés, anotá el último peso que recuerdes.',
  },
  {
    id: 'job',
    title: '¿De qué trabajás?',
    category: 'contexto',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: Trabajo como abogado en una oficina',
  },
  {
    id: 'goal',
    title: '¿Qué querés conseguir y por qué lo estás buscando?',
    category: 'contexto',
    required: true,
    type: 'textarea',
    placeholder: 'Contame qué querés lograr y qué te motiva',
  },
  {
    id: 'body_scale',
    title: '¿Tenés balanza o báscula digital para chequear tu peso corporal de forma diaria?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'body_scale_yes', text: 'Sí 😉', value: 2 },
      { id: 'body_scale_no', text: 'Todavía no', value: 0 },
    ],
  },
  {
    id: 'food_scale',
    title: '¿Tenés balanza o báscula digital para pesar alimentos?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'food_scale_yes', text: 'Sí 😉', value: 2 },
      { id: 'food_scale_no', text: 'Todavía no', value: 0 },
    ],
  },
  {
    id: 'spray_oil',
    title: '¿Tenés aceite en aerosol / fritolín?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'oil_yes', text: 'Sí 😉', value: 2 },
      { id: 'oil_no', text: 'Todavía no', value: 0 },
    ],
  },
  {
    id: 'steps_app',
    title:
      '¿Tenés alguna app como "Steps App", "Samsung Health" o "Salud" para contar tus pasos diarios?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'steps_yes', text: 'Sí 😉', value: 2 },
      { id: 'steps_no', text: 'Todavía no', value: 0 },
    ],
  },
  {
    id: 'junk_food',
    title: '¿Comés más de 4 veces por semana comida chatarra o no saludable?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'junk_yes', text: 'Sí 🙄', value: 0 },
      { id: 'junk_no', text: 'No 😉', value: 2 },
    ],
  },
  {
    id: 'water',
    title: '¿Te sentís bien con la cantidad de agua que tomás por día?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'water_yes', text: 'Sí 😉', value: 2 },
      { id: 'water_no', text: 'No, siento que no tomo suficiente agua', value: 0 },
    ],
  },
  {
    id: 'vices',
    title: '¿Tenés algún vicio actualmente? (Elegí todos los que te apliquen)',
    category: 'habitos',
    required: true,
    type: 'multi-choice',
    answers: [
      { id: Addiction.WEED, text: 'Fumo marihuana' },
      { id: Addiction.CIGARETTES, text: 'Fumo cigarrillo' },
      { id: Addiction.ALCOHOL, text: 'Tomo bastante alcohol' },
      { id: Addiction.GAMBLING, text: 'Tengo ludopatía (casino)' },
      { id: Addiction.VIDEOGAMES, text: 'Juego bastante a los videojuegos' },
      { id: Addiction.RRSS, text: 'Uso demasiado TikTok u otras apps para distraerme' },
      { id: 'vice_none', text: 'No tengo ningún vicio', value: 3 },
    ],
  },

  {
    id: 'vices_frequency',
    title: '¿Cada cuánto lo consumís?',
    category: 'habitos',
    type: 'single-choice',
    answers: [
      { id: AddictionFrequency.HOUR, text: 'Cada hora' },
      { id: AddictionFrequency.DAY, text: 'Por día' },
      { id: AddictionFrequency.WEEK, text: 'Por semana' },
      { id: AddictionFrequency.MONTH, text: 'Por mes' },
    ],
  },

  {
    id: 'other_health_conditions',
    title: '¿Tenés HOY alguna de estas otras condiciones?',
    category: 'salud',
    required: true,
    type: 'multi-choice',
    answers: [
      { id: 'cond_cholesterol', text: 'Colesterol o triglicéridos elevados' },
      { id: 'cond_gastritis', text: 'Gastritis o acidez' },
      { id: 'cond_constipation', text: 'Constipación/Estreñimiento o diarrea' },
      { id: 'cond_colon', text: 'Colon irritable' },
      { id: 'cond_none_other', text: 'No tengo ninguna', value: 3 },
      { id: 'cond_other_extra', text: 'Otro' },
    ],
  },
  {
    id: 'other_health_conditions_detail',
    title: 'Otro (otras condiciones)',
    category: 'salud',
    type: 'text',
    placeholder: 'Detallá cualquier otra condición',
  },
  {
    id: 'sleep_issues',
    title: '¿Qué problemas tenés para dormir? (Elegí todos los que apliquen)',
    category: 'habitos',
    required: true,
    type: 'multi-choice',
    answers: [
      { id: 'sleep_bathroom', text: 'Me despierto a la madrugada para ir al baño' },
      { id: 'sleep_unknown', text: 'Me despierto y no sé por qué' },
      { id: 'sleep_fall_asleep', text: 'Tardo más de lo que me gustaría en dormirme' },
      { id: 'sleep_noise', text: 'Me despierto por ruidos, calor u otros factores' },
      { id: 'sleep_snore', text: 'Tengo ronquidos' },
      { id: 'sleep_none', text: 'No tengo problemas, duermo como un bebé 😴', value: 3 },
      { id: 'sleep_other', text: 'Otro' },
    ],
  },
  {
    id: 'sleep_other_detail',
    title: 'Otro (problemas de sueño)',
    category: 'habitos',
    type: 'text',
    placeholder: 'Describí cualquier otro problema para dormir',
  },
  {
    id: 'wake_up_time',
    title: '¿Cuánto tardás en levantarte de la cama luego de despertarte?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'wake_immediate', text: 'Me levanto al instante', value: 3 },
      { id: 'wake_5', text: '5 minutos', value: 2 },
      { id: 'wake_10', text: '10 minutos', value: 1 },
      { id: 'wake_more', text: 'Más de 10 minutos', value: 0 },
    ],
  },
  {
    id: 'screens_in_bed',
    title: '¿Ves pantallas (compu, televisión, celular) cuando te acostás en la cama?',
    category: 'habitos',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'screens_yes', text: 'Sí 😬', value: 0 },
      { id: 'screens_no', text: 'No, uso la cama sólo para dormir 😴', value: 3 },
    ],
  },
  {
    id: 'training_days',
    title:
      '¿Cuántos días por semana estás dispuesto a entrenar SIN faltar? (Si no entrenás, elegí "3")',
    category: 'compromiso',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'train_3', text: '3 días', value: 1 },
      { id: 'train_4', text: '4 días', value: 2 },
      { id: 'train_5', text: '5 días', value: 3 },
      { id: 'train_6', text: '6 días', value: 4 },
    ],
  },
  {
    id: 'training_location',
    title: '¿Dónde vas a entrenar al principio?',
    category: 'contexto',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'train_gym', text: 'Gym', value: 3 },
      { id: 'train_home_none', text: 'Casa sin material', value: 1 },
      { id: 'train_home_weights', text: 'Casa con pesos libres', value: 2 },
      { id: 'train_home_multigym', text: 'Casa con Multigym', value: 2 },
    ],
  },
  {
    id: 'supplement',
    title: '¿Tomás o consumís algún suplemento o medicamento? Contame cuál/es.',
    category: 'salud',
    type: 'textarea',
    placeholder: 'Ej: Creatina, Omega 3, Ibuprofeno...',
  },
  {
    id: 'supplement_unit',
    title: 'Unidad de medida del suplemento/medicamento',
    category: 'salud',
    type: 'single-choice',
    answers: [
      { id: SupplementUnit.MG, text: 'mg' },
      { id: SupplementUnit.G, text: 'g' },
      { id: SupplementUnit.ML, text: 'ml' },
    ],
  },
  {
    id: 'supplement_amount',
    title: '¿Cuánta cantidad tomás en cada dosis?',
    category: 'salud',
    type: 'number',
    placeholder: 'Ej: 5',
    helperText: 'Ingresá sólo números. Ejemplo: 5',
  },
  {
    id: 'supplement_frequency',
    title: '¿Con qué frecuencia lo tomás?',
    category: 'salud',
    type: 'single-choice',
    answers: [
      { id: SupplementHowOften.HOUR, text: 'Cada hora' },
      { id: SupplementHowOften.DAY, text: 'Por día' },
      { id: SupplementHowOften.WEEK, text: 'Por semana' },
      { id: SupplementHowOften.MONTH, text: 'Por mes' },
    ],
  },
  {
    id: 'video_upload',
    title: 'Subí tu video de 45 segundos imitando a Ripo',
    category: 'logistica',
    required: true,
    type: 'file',
    description: (
      <div className="space-y-4 text-sm text-slate-200">
        <p>
          Andá a algún baño o habitación y grabá el siguiente video (imitando cada segundo de mi video
          que aparece abajo) para armar tu plan según cuánta grasa y cuanto músculo tengas 💪🏼
        </p>
        <p>
          No compartiremos en ninguna red social tu video a menos que vos nos lo permitas por escrito.
          No lo grabes al espejo, sólo usá tu cámara selfie (la cámara de adelante de tu celular) e
          imitá el video que aparece más abajo.
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>🙋🏻‍♂️ Hombres: Con el torso desnudo y short/ropa interior.</li>
          <li>
            🙋🏻‍♀️ Mujeres: Con top y short o ropa interior, mostrando todo el abdomen hasta por debajo
            del ombligo.
          </li>
          <li>⏰ Tiempo que tardarás en hacerlo: 45 segundos.</li>
        </ul>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/CcyUoPUNWgM"
            title="Video de referencia"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p>Subilo directamente acá. Nosotros comprimimos y optimizamos el video automáticamente.</p>
      </div>
    ),
    helperText:
      'Formatos aceptados: MP4, MOV, MKV o WEBM. Peso máximo recomendado: 250 MB. Te avisamos cuando termine de comprimir.',
    accept: 'video/*',
    maxFiles: 1,
    enableVideoCompression: true,
  },
  {
    id: 'video_confirmation',
    title:
      '¿Grabaste el video de 45 segundos e imitaste a Ripo para que podamos armar tu plan según tu cuerpo?',
    category: 'logistica',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'video_whatsapp',
        text: 'No, pero hoy sin falta lo voy a enviar por Whatsapp 💪🏼',
        value: 1,
        blocksProgress: true,
      },
      {
        id: 'video_uploaded',
        text: 'Sí Ripo, acabo de subir mi video en este mismo formulario 💪🏼',
        value: 3,
      },
      {
        id: 'video_not_recording',
        text: 'No me grabaré, entonces dejaré de contestar este formulario.',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
  {
    id: 'country',
    title: 'País',
    category: 'datos',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: Argentina',
  },
  {
    id: 'city',
    title: 'Ciudad',
    category: 'datos',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: Buenos Aires',
  },
  {
    id: 'birthday',
    title: '¿Cuándo es tu próximo cumpleaños?',
    category: 'datos',
    required: true,
    type: 'date',
  },
  {
    id: 'referral',
    title: '¿Cómo llegaste acá?',
    category: 'contexto',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'ref_tiktok', text: 'Me apareciste en TikTok', value: 1 },
      { id: 'ref_instagram', text: 'Te vi en Instagram', value: 1 },
      { id: 'ref_youtube', text: 'Te vi en YouTube', value: 1 },
      { id: 'ref_friend', text: 'Por un amigo/familiar (contame quién)', value: 1 },
      { id: 'ref_other', text: 'Otro', value: 1 },
    ],
  },
  {
    id: 'referral_detail',
    title: 'Si fue por un amigo/familiar u "Otro", contame quién o cómo',
    category: 'contexto',
    type: 'text',
    placeholder: 'Ejemplo: Me recomendó Juan Perez',
  },
  {
    id: 'email',
    title: '¿Cuál es tu email?',
    category: 'contacto',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: juan@email.com',
    helperText: 'Usá el mail que revisás todos los días.',
  },
  {
    id: 'instagram',
    title: '¿Cuál es tu usuario de Instagram?',
    category: 'contacto',
    required: true,
    type: 'text',
    placeholder: 'Ejemplo: @joa.ripoli',
  },
  {
    id: 'whatsapp_country_code',
    title: 'Código de país de tu Whatsapp (sin signos, solo números)',
    category: 'contacto',
    required: true,
    type: 'number',
    placeholder: 'Ejemplo: 54',
    helperText: 'Escribí 1 a 3 dígitos. Ej: 54 para Argentina.',
  },
  {
    id: 'whatsapp_number',
    title: 'Número local de Whatsapp (sin el código de país)',
    category: 'contacto',
    required: true,
    type: 'number',
    placeholder: 'Ejemplo: 1122334455',
    helperText: 'Sólo números, sin espacios ni prefijos.',
  },
  {
    id: 'whatsapp_full',
    title: '¿Tenés el número completo con +? (Opcional)',
    category: 'contacto',
    type: 'text',
    placeholder: 'Ejemplo: +5491122334455',
    helperText: 'Si ya lo tenés armado, pegalo acá para que lo revisemos.',
  },
  {
    id: 'whatsapp_confirmation',
    title: '¿Estás seguro que escribiste bien tu número de Whatsapp?',
    category: 'contacto',
    required: true,
    type: 'single-choice',
    answers: [
      { id: 'whatsapp_ok', text: 'Sí Ripo, recién lo revisé y lo escribí perfecto 💪🏼', value: 2 },
      { id: 'whatsapp_other', text: 'Otro', value: 1 },
    ],
  },
  {
    id: 'whatsapp_other_detail',
    title: 'Otro (Whatsapp)',
    category: 'contacto',
    type: 'text',
    placeholder: 'Aclará cualquier detalle extra para contactarte',
  },
  {
    id: 'final_message',
    title: 'Por último: ¿Algo que quieras comentarme antes de armar tu plan?',
    category: 'contexto',
    type: 'textarea',
    placeholder: 'Si no hay nada, podés dejarlo vacío',
  },
  {
    id: 'start_commitment',
    title:
      'Luego de tocar "ENVIAR" tendrás que entrar al link que aparece para ir a mi Whatsapp. ¿Vas a entrar al link para empezar tu cambio físico?',
    category: 'compromiso',
    required: true,
    type: 'single-choice',
    answers: [
      {
        id: 'start_link_yes',
        text: 'Sí Ripo, estaré atento a la siguiente pantalla para entrar y empezar mi cambio 💪🏼',
        value: 3,
      },
      {
        id: 'start_link_no',
        text: 'No le prestaré atención a la siguiente pantalla, por lo que no empezaré mi cambio físico.',
        value: 0,
        blocksProgress: true,
      },
    ],
  },
]


