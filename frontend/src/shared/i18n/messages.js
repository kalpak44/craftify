import en from './locales/en.json';
import bg from './locales/bg.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import de from './locales/de.json';
import el from './locales/el.json';
import es from './locales/es.json';
import et from './locales/et.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import ga from './locales/ga.json';
import hr from './locales/hr.json';
import hu from './locales/hu.json';
import it from './locales/it.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import mt from './locales/mt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ro from './locales/ro.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';
import sv from './locales/sv.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const SUPPORTED_LOCALES = [
    {
        code: "en",
        label: "English",
        messages: en,
    },
    {
        code: "bg",
        label: "Български",
        messages: bg,
    },
    {
        code: "cs",
        label: "Čeština",
        messages: cs,
    },
    {
        code: "da",
        label: "Dansk",
        messages: da,
    },
    {
        code: "de",
        label: "Deutsch",
        messages: de,
    },
    {
        code: "el",
        label: "Ελληνικά",
        messages: el,
    },
    {
        code: "es",
        label: "Español",
        messages: es,
    },
    {
        code: "et",
        label: "Eesti",
        messages: et,
    },
    {
        code: "fi",
        label: "Suomi",
        messages: fi,
    },
    {
        code: "fr",
        label: "Français",
        messages: fr,
    },
    {
        code: "ga",
        label: "Gaeilge",
        messages: ga,
    },
    {
        code: "hr",
        label: "Hrvatski",
        messages: hr,
    },
    {
        code: "hu",
        label: "Magyar",
        messages: hu,
    },
    {
        code: "it",
        label: "Italiano",
        messages: it,
    },
    {
        code: "lt",
        label: "Lietuvių",
        messages: lt,
    },
    {
        code: "lv",
        label: "Latviešu",
        messages: lv,
    },
    {
        code: "mt",
        label: "Malti",
        messages: mt,
    },
    {
        code: "nl",
        label: "Nederlands",
        messages: nl,
    },
    {
        code: "pl",
        label: "Polski",
        messages: pl,
    },
    {
        code: "pt",
        label: "Português",
        messages: pt,
    },
    {
        code: "ro",
        label: "Română",
        messages: ro,
    },
    {
        code: "sk",
        label: "Slovenčina",
        messages: sk,
    },
    {
        code: "sl",
        label: "Slovenščina",
        messages: sl,
    },
    {
        code: "sv",
        label: "Svenska",
        messages: sv,
    },
    {
        code: "ru",
        label: "Русский",
        messages: ru,
    },
    {
        code: "uk",
        label: "Українська",
        messages: uk,
    }
];

export const DEFAULT_LOCALE = "en";

export const MESSAGES = Object.fromEntries(
    SUPPORTED_LOCALES.map(({code, messages}) => [code, messages]),
);
