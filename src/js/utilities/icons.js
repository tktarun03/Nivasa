/**
 * Lucide icons, tree-shaken: only the icons imported here ship to the browser.
 * icon('heart') returns an inline SVG string.
 */
import {
  House, Compass, LayoutGrid, Heart, Settings, Search, X, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown,
  SlidersHorizontal, RefreshCw, Share2, Lock, LockOpen, Bookmark, BookmarkPlus, Plus, Trash, GripVertical, Ellipsis,
  Check, CircleCheck, CircleExclamationPoint, TriangleExclamationPoint, Info, ExternalLink, Sparkles, Ruler,
  IndianRupee, Layers, BookOpen, Palette, Sun, Moon, Monitor, Type, Languages, Download, Upload, RotateCcw,
  Maximize2, Copy, Pencil, ArrowUp, ArrowDown, ShieldCheck, Scale, MapPin, CloudRain, Hand, Smartphone, Eye,
  Images, Calculator, Library, Gem, Wifi, WifiOff, ArrowUpDown, ListFilter, Undo2, Play, Pause, Armchair, Shapes,
  Lamp, Store, ClipboardCheck, RotateCcwClock, Pin, Image, Grid2x2,
} from 'lucide';

const ICONS = {
  home: House, explore: Compass, categories: LayoutGrid, heart: Heart, settings: Settings, search: Search, x: X,
  back: ArrowLeft, 'chevron-right': ChevronRight, 'chevron-left': ChevronLeft, 'chevron-down': ChevronDown,
  filters: SlidersHorizontal, refresh: RefreshCw, share: Share2, lock: Lock, unlock: LockOpen, bookmark: Bookmark,
  'bookmark-plus': BookmarkPlus, plus: Plus, trash: Trash, grip: GripVertical, more: Ellipsis, check: Check,
  'check-circle': CircleCheck, 'alert-circle': CircleExclamationPoint, warning: TriangleExclamationPoint, info: Info,
  external: ExternalLink, sparkles: Sparkles, ruler: Ruler, rupee: IndianRupee, layers: Layers, book: BookOpen,
  palette: Palette, sun: Sun, moon: Moon, monitor: Monitor, type: Type, languages: Languages, download: Download,
  upload: Upload, reset: RotateCcw, expand: Maximize2, copy: Copy, pencil: Pencil, 'arrow-up': ArrowUp,
  'arrow-down': ArrowDown, shield: ShieldCheck, scale: Scale, pin: MapPin, rain: CloudRain, hand: Hand,
  phone: Smartphone, eye: Eye, images: Images, calculator: Calculator, library: Library, gem: Gem, wifi: Wifi,
  'wifi-off': WifiOff, sort: ArrowUpDown, 'list-filter': ListFilter, undo: Undo2, play: Play, pause: Pause,
  armchair: Armchair, shapes: Shapes, lamp: Lamp, store: Store, clipboard: ClipboardCheck, history: RotateCcwClock,
  'pin-photo': Pin, image: Image, grid: Grid2x2,
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export function icon(name, { size, cls = '', label } = {}) {
  const node = ICONS[name];
  if (!node) return '';
  const inner = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')}/>`)
    .join('');
  const aria = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  const dim = size ? `width="${size}" height="${size}"` : 'width="24" height="24"';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide ${cls}" ${aria}>${inner}</svg>`;
}

/** Replace <i data-icon="name"></i> placeholders in static HTML. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    const tmp = document.createElement('template');
    tmp.innerHTML = icon(name);
    const svg = tmp.content.firstElementChild;
    if (!svg) return;
    if (el.className) svg.classList.add(...el.className.split(/\s+/).filter(Boolean));
    el.replaceWith(svg);
  });
}

export const iconNames = Object.keys(ICONS);
