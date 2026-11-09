# Interaction patterns

The six reference screenshots named in the original brief were not supplied, so this library maps the written pattern list in the brief to real product features. Live demos are on the in-app **Interaction patterns** page.

| Pattern | Module | Where it's used |
| --- | --- | --- |
| Sticky header / filter bar | CSS `.app-header`, `.filter-bar` | All pages; Explore, Materials |
| Scroll snapping | CSS `.h-scroll` | Home featured, Collections, related designs |
| Staggered scroll reveals | `interactions/motion.js` (`revealIn`) | Card grids |
| Infinite scroll + end state | `interactions/infinite.js` | Explore, Category |
| Scroll progress bar | `motion.js` (`initScrollProgress`) | Header on every page |
| Zoom-on-scroll, parallax | `motion.js` (`data-zoom-scroll`, `data-parallax`) | Home hero |
| Scrolltelling | `interactions/scrolltelling.js` | Home project story |
| Bottom sheets / drawers, swipe to dismiss | `components/sheet.js` | Filters, save to board, details |
| Action sheets | `sheet.js` (`actionSheet`) | Long-press menus |
| Spring buttons, ripple | CSS + `interactions/press.js` | All buttons |
| Page transitions | CSS `@view-transition` | Supporting browsers |
| SVG path drawing | `.draw-path` + `motion.js` | Patterns page diagram |
| Marquee (pausable) | CSS `.marquee` | Home styles |
| Card tilt (pointer only) | `interactions/tilt.js` | Styles, Home tools |
| Morphing icon, gooey toggle | CSS `.icon-swap`, SVG filter | Photo lock; isolated demo |
| Skeletons, blur-up lazy images | `components/media.js` | All image grids |
| Button busy state | `press.js` (`withBusy`) | Refresh, self-check |
| Progress ring / multi-step | Budget planner, Settings self-check, onboarding | Real values only |
| Optimistic favourites + rollback | `services/favourites.js` | Every heart |
| Pull to refresh (+ button) | `interactions/pullToRefresh.js` | Explore |
| Long press / double tap / swipe | `interactions/gestures.js` | Cards, gallery, boards |
| Drag to reorder (+ buttons) | `interactions/reorder.js` | Mood boards |
| Pinch zoom, full-screen viewer | PhotoSwipe | Design gallery |
| Adaptive / minimising bottom nav | `navigation.js` | All pages (phones) |
| Bottom accessory panel | CSS `.accessory` | Materials compare tray, budget total |
| Scope bar, pull-down menu, popover | `components/popover.js` | Explore sort, Styles |
| Alphabetical index | `interactions/alphaIndex.js` | Materials |
| Live status pill | `app.js` (`setLiveStatus`) | Header |
| Toast with Undo, HUD | `components/toast.js` | All saved-data changes |
| Haptics (optional) | `services/haptics.js` | Supported Android browsers only |

Native iOS features (Dynamic Island, Live Activities, system haptics) are not available to web pages; the live status pill and HUD are web stand-ins and are not presented as native integrations.
