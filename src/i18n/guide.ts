// Long-form "How it works" content (the IP Method, the evidence, how to apply
// it). Kept separate from the flat string table because it is prose.
import type { Language } from '../data/types';

export interface GuideSection {
  h: string;
  p: string[];
}
export interface Guide {
  title: string;
  intro: string;
  sections: GuideSection[];
}

const en: Guide = {
  title: 'How Infinite works',
  intro:
    'Infinite turns the IP Method into an automatic loop and grounds every rule in training science. Here is the method, the evidence behind it, and exactly how you apply it.',
  sections: [
    {
      h: '1 · The IP Method, in one loop',
      p: [
        'Your physique is governed by six movement patterns: horizontal press, horizontal pull, vertical press, vertical pull, squat, and hinge. Treat each like a skill you level up. Smaller isolation muscles (side and rear delts, biceps, triceps, calves, abs, traps) are tracked on the side.',
        'Every exercise variation is only productive for a window. While you keep adding weight or reps it is "alive" (green). When progress stalls, its life cycle has "ended" (red) — grinding it past that point yields little.',
        'The loop: run one variation with double progression → it stalls → swap to a same-pattern variation that fixes the weak point the last one exposed → your strength carries forward → over time you build a roster of your best variations and cycle them back in.',
      ],
    },
    {
      h: '2 · Why it builds muscle (the evidence)',
      p: [
        'Progressive overload — gradually doing more over time — is the main driver of growth. In a fixed 6–12 rep range you use double progression: add reps until you reach the top of the range, then add the smallest weight jump and let reps reset toward the bottom.',
        'Because both weight and reps move, the app tracks estimated 1-rep-max (e1RM, Epley formula) as one clean progress signal — so a day where weight goes up but reps go down still counts correctly.',
        'Most working sets should stop about 0–3 reps short of failure (RIR 0–3) — enough to grow without burying you in fatigue. You can log RIR per set in the logger.',
        'Volume matters per muscle, per week. The app compares your weekly hard sets to landmarks — MEV (minimum effective), MAV (the productive window), and MRV (above which it is junk volume) — and flags each muscle as below / in range / above.',
        'Fatigue accumulates, so sets ramp across the block and then a deload week lets you recover and realise the gains before the next block starts.',
        'Rotation works — but only on a stall. Swapping exercises too often makes progressive overload impossible to track, so the app only suggests a swap once a lift has genuinely ended. Rotate on stagnation, not on a whim.',
      ],
    },
    {
      h: '3 · How you apply it, week to week',
      p: [
        'Open the Today tab, pick the day, and tap Start workout.',
        'Do the warm-ups shown, then log each working set with the weight/reps steppers. Try to beat last time’s faint “ghost” numbers. Tap the green check to finish a set — the rest timer slides up automatically.',
        'Each lift is auto-rated 1 (you beat last session) or 0 (you didn’t). Watch its life-cycle bar fill green → amber → red.',
        'When a bar turns red (ended), open the lift and tap Swap. Say where you usually fail; the app offers three same-pattern options that target that weak point, pre-filled with a sensible starting weight. Pick one and keep progressing.',
        'Check the Weekly volume screen to keep each muscle inside its productive band. At the deload week, recover — then generate the next block and your best variations rotate back in automatically.',
      ],
    },
    {
      h: '4 · Reading the screens',
      p: [
        'Green = progressing, amber = slowing, red = cycle ended. Colour is always paired with a label or icon, never used alone.',
        'The ring on each pattern is your level from total strength gained. The runway bar shows how close a lift is to needing a swap. The sparkline is its recent e1RM trend.',
        'Everything is stored on your device and works offline. Back up anytime with Settings → Export data.',
      ],
    },
  ],
};

const ar: Guide = {
  title: 'كيف يعمل إنفينيت',
  intro:
    'يحوّل إنفينيت طريقة IP إلى حلقة تلقائية، ويبني كل قاعدة على علم التدريب. إليك الطريقة، والأدلة خلفها، وكيف تطبّقها بالضبط.',
  sections: [
    {
      h: '١ · طريقة IP في حلقة واحدة',
      p: [
        'يحكم جسمك ستة أنماط حركية: دفع أفقي، سحب أفقي، دفع رأسي، سحب رأسي، سكوات، ومفصلة الورك. تعامل مع كل نمط كمهارة تطوّرها. أما عضلات العزل الأصغر (الكتف الجانبي والخلفي، البايسبس، الترايسبس، السمانة، البطن، الترابيس) فتُتابَع بشكل منفصل.',
        'كل تمرين مفيد لفترة محدودة فقط. ما دمت تزيد الوزن أو التكرارات فهو «حيّ» (أخضر). وعندما يتوقف التقدم تكون دورته قد «انتهت» (أحمر)، والإصرار عليه بعد ذلك قليل الفائدة.',
        'الحلقة: درّب تمرينًا بالتدرّج المزدوج ← يتوقف ← بدّل إلى تمرين من نفس النمط يعالج نقطة الضعف التي كشفها السابق ← تنتقل قوتك للأمام ← ومع الوقت تبني قائمة بأفضل تمارينك وتعيد إدخالها.',
      ],
    },
    {
      h: '٢ · لماذا يبني العضلات (الأدلة)',
      p: [
        'الزيادة التدريجية — أن تفعل أكثر تدريجيًا — هي المحرّك الأساسي للنمو. ضمن نطاق ثابت ٦–١٢ تكرار تستخدم التدرّج المزدوج: زِد التكرارات حتى تبلغ أعلى النطاق، ثم أضف أصغر زيادة في الوزن ودع التكرارات تعود نحو الأسفل.',
        'لأن الوزن والتكرارات يتغيران معًا، يتتبّع التطبيق أقصى تكرار تقديري (e1RM بمعادلة إيبلي) كإشارة تقدّم واحدة واضحة — حتى لو زاد الوزن ونقصت التكرارات يُحتسب التقدّم بشكل صحيح.',
        'يُفضّل إيقاف معظم الجولات على بُعد ٠–٣ تكرارات من الفشل (RIR ٠–٣) — كافٍ للنمو دون إرهاق مفرط. يمكنك تسجيل الـ RIR لكل جولة في صفحة التسجيل.',
        'الحجم مهم لكل عضلة أسبوعيًا. يقارن التطبيق جولاتك الأسبوعية بالمعالم — الحد الأدنى الفعّال (MEV)، والنطاق المثمر (MAV)، والحد الأقصى القابل للتعافي (MRV) الذي يصبح فوقه الحجم زائدًا — ويصنّف كل عضلة: أقل/ضمن النطاق/أعلى.',
        'يتراكم التعب، لذا ترتفع الجولات عبر البلوك ثم يأتي أسبوع الدّيلود ليتيح التعافي وتحقيق المكاسب قبل بدء البلوك التالي.',
        'التبديل مفيد — لكن عند التوقف فقط. التبديل المتكرر يجعل تتبّع الزيادة التدريجية مستحيلًا، لذا لا يقترح التطبيق التبديل إلا بعد توقّف التمرين فعليًا. بدّل عند الركود لا حسب المزاج.',
      ],
    },
    {
      h: '٣ · كيف تطبّقها أسبوعًا بأسبوع',
      p: [
        'افتح تبويب «اليوم»، اختر اليوم، واضغط «ابدأ التمرين».',
        'نفّذ الإحماء المعروض، ثم سجّل كل جولة عمل بأزرار الوزن/التكرارات. حاول تجاوز أرقام «المرة الماضية» الباهتة. اضغط علامة الصح الخضراء لإنهاء الجولة — وسيظهر مؤقّت الراحة تلقائيًا.',
        'يُقيَّم كل تمرين تلقائيًا ١ (تجاوزت الجلسة السابقة) أو ٠ (لم تتجاوز). راقب شريط دورة الحياة يمتلئ أخضر ← كهرماني ← أحمر.',
        'حين يتحول الشريط إلى الأحمر (انتهى)، افتح التمرين واضغط «تبديل». حدّد أين تفشل عادةً؛ يقترح التطبيق ثلاثة بدائل من نفس النمط تستهدف نقطة الضعف، مع وزن بداية مناسب مُعبّأ مسبقًا. اختر واحدًا وواصل التقدم.',
        'راجع صفحة «الحجم الأسبوعي» لإبقاء كل عضلة ضمن نطاقها المثمر. في أسبوع الدّيلود تعافَ، ثم أنشئ البلوك التالي لتعود أفضل تمارينك تلقائيًا.',
      ],
    },
    {
      h: '٤ · قراءة الشاشات',
      p: [
        'الأخضر = يتقدم، الكهرماني = يتباطأ، الأحمر = انتهت الدورة. يقترن اللون دائمًا بنص أو رمز، ولا يُستخدم وحده.',
        'الحلقة على كل نمط هي مستواك من إجمالي القوة المكتسبة. وشريط المسار يوضّح قرب التمرين من الحاجة إلى التبديل. والمخطط المصغّر يبيّن اتجاه الـ e1RM الأخير.',
        'كل شيء محفوظ على جهازك ويعمل دون إنترنت. انسخ بياناتك احتياطيًا في أي وقت من الإعدادات ← تصدير البيانات.',
      ],
    },
  ],
};

const GUIDES: Record<Language, Guide> = { en, ar };

export function getGuide(lang: Language): Guide {
  return GUIDES[lang];
}
