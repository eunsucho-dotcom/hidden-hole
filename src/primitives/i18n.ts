/**
 * 다국어 (i18n) — 디바이스 OS 언어 자동 감지
 *
 * 한국어 ko / 그 외 영어 en (기본). navigator.language 첫 두 글자 기준.
 * 키 미존재 시 en fallback → key 그대로 반환 (안전).
 */

export type Lang = 'ko' | 'en';

const messages: Record<Lang, Record<string, string>> = {
  ko: {
    'popup.title': '청소 준비 완료!',
    'popup.subtitle': '탭해서 닫기',

    'hud.skill_eok.label': '오기 발동',
    'hud.skill_clear.label': '즉시 클리어',
    'hud.skill_eok.cond': '5장 클리어',
    'hud.skill_clear.cond': '제한시간 내\n10장 클리어',

    'result.total_score': '총점',
    'result.score': '쓰레기 점수',
    'result.time_bonus': '시간 보너스',
    'result.combo_bonus': '콤보 보너스',
    'result.perfect_bonus': '완벽 보너스',
  },
  en: {
    'popup.title': 'Ready to clean!',
    'popup.subtitle': 'Tap to close',

    'hud.skill_eok.label': 'Spirit',
    'hud.skill_clear.label': 'Sweep',
    'hud.skill_eok.cond': 'Clear 5 items',
    'hud.skill_clear.cond': 'Clear 10 items\nbefore time runs out',

    'result.total_score': 'TOTAL SCORE',
    'result.score': 'Trash Score',
    'result.time_bonus': 'Time Bonus',
    'result.combo_bonus': 'Combo Bonus',
    'result.perfect_bonus': 'Perfect Bonus',
  },
};

let currentLang: Lang = detectLang();

function detectLang(): Lang {
  return 'en';
}

/** 키 기반 번역 */
export function t(key: string): string {
  return messages[currentLang][key] ?? messages.en[key] ?? key;
}

/** { ko, en } 구조의 객체에서 현재 언어 텍스트 반환 */
export function tBilingual(obj: { ko: string; en: string }): string {
  return obj[currentLang] ?? obj.en;
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
}
