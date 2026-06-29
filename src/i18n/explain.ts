// Plain-language explanations for the little "?" buttons, so nothing is jargon.
import type { Language } from '../data/types';

export interface Explain {
  title: string;
  body: string;
}

const EN: Record<string, Explain> = {
  strength_score: {
    title: 'Strength score',
    body: 'A single number that estimates how strong you are on a lift, worked out from the weight and reps of your best set (an estimated 1-rep max). It lets the app tell if you got stronger even when the weight goes up but reps go down. Higher = stronger.',
  },
  life_cycle: {
    title: 'Life cycle',
    body: 'Every exercise only keeps working for a while. The bar fills green → amber → red as you stop beating your numbers. Green = still growing, amber = slowing down, red = it has stalled and it is time to switch to a new exercise.',
  },
  pattern: {
    title: 'Movement pattern',
    body: 'There are six big movements that build your body: horizontal press, horizontal pull, vertical press, vertical pull, squat and hinge. Every exercise belongs to one. You level each one up like a skill.',
  },
  volume: {
    title: 'Weekly sets (volume)',
    body: 'How many hard sets you do for a muscle each week. Too few and it barely grows (below MEV); a sweet spot grows it best (the green band); too many is wasted and hard to recover from (above MRV). Stay in the green band.',
  },
  rir: {
    title: 'RIR (reps in reserve)',
    body: 'How many more reps you could have done before failing. For growth, stop most sets with about 0–3 reps left in the tank — hard, but not all-out every time. It is optional to log.',
  },
  level: {
    title: 'Levels & XP',
    body: 'You earn XP for training: finishing workouts, beating your last numbers, setting records and evolving stalled lifts. XP raises your level and rank. It is just a fun way to see your consistency add up — the real progress is the strength and muscle.',
  },
};

const AR: Record<string, Explain> = {
  strength_score: {
    title: 'مؤشر القوة',
    body: 'رقم واحد يقدّر مدى قوتك في تمرين ما، محسوب من وزن وتكرارات أفضل جولة لديك (أقصى تكرار تقديري). يتيح للتطبيق معرفة إن ازددت قوة حتى لو زاد الوزن ونقصت التكرارات. كلما زاد = أقوى.',
  },
  life_cycle: {
    title: 'دورة الحياة',
    body: 'كل تمرين يبقى مفيدًا لفترة. يمتلئ الشريط أخضر ← كهرماني ← أحمر مع توقفك عن تجاوز أرقامك. الأخضر = ما زال ينمّي، الكهرماني = يتباطأ، الأحمر = توقف وحان وقت تبديل التمرين.',
  },
  pattern: {
    title: 'نمط الحركة',
    body: 'هناك ست حركات كبرى تبني جسمك: دفع أفقي، سحب أفقي، دفع رأسي، سحب رأسي، سكوات، ومفصلة الورك. كل تمرين ينتمي لإحداها، وتطوّر كلًا منها كمهارة.',
  },
  volume: {
    title: 'الجولات الأسبوعية (الحجم)',
    body: 'عدد الجولات الجادة لكل عضلة أسبوعيًا. القليل جدًا لا ينمّي (أقل من MEV)؛ والنطاق المثالي ينمّي أفضل (الشريط الأخضر)؛ والكثير مهدر وصعب التعافي منه (فوق MRV). ابقَ في النطاق الأخضر.',
  },
  rir: {
    title: 'RIR (التكرارات المتبقية)',
    body: 'كم تكرارًا إضافيًا كان بإمكانك أداؤه قبل الفشل. للنمو، أوقف معظم الجولات وبقي لديك ٠–٣ تكرارات — صعب لكن ليس حتى الفشل في كل مرة. تسجيله اختياري.',
  },
  level: {
    title: 'المستويات والنقاط',
    body: 'تكسب نقاطًا بالتدريب: إنهاء التمارين، تجاوز أرقامك، تسجيل أرقام قياسية، وتطوير التمارين المتوقفة. ترفع النقاط مستواك ورتبتك. إنها طريقة ممتعة لرؤية انتظامك يتراكم — والتقدم الحقيقي هو القوة والعضلات.',
  },
};

export function getExplain(lang: Language, key: string): Explain {
  return (lang === 'ar' ? AR : EN)[key] ?? { title: key, body: '' };
}
