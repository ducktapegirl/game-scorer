// App shell: mounts the manual entry screen with the Harmonies module. A
// game-select screen arrives only when there is a second game to select.

import { mountEntryScreen } from "../core/ui/entry-screen";
import { harmonies } from "../games/harmonies";
import { EMPTY_CONFIG } from "../games/harmonies/config";

mountEntryScreen(document.getElementById("app")!, harmonies, EMPTY_CONFIG);
