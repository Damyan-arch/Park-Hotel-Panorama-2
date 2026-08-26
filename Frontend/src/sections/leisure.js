import { state } from "../state.js";
import { t, tOrSetting } from "../i18n.js";
import { mediaUrl } from "../dom-utils.js";

export function renderLeisure() {
  return `
      <section class="leisure" id="leisure">
        <div class="container">
          <div class="section-head center">
            <div class="eyebrow">${t("leisure.eyebrow")}</div>
            <h2>${t("leisure.title")}</h2>
          </div>

          <div class="leisure-block">
            <div class="leisure-media leisure-grid">
              <img src="${mediaUrl(state.settings.leisurePlayImage1)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage2)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage3)}" alt="Kids' adventure playground" loading="lazy" />
              <img src="${mediaUrl(state.settings.leisurePlayImage4)}" alt="Kids playing football" loading="lazy" />
            </div>
            <div class="leisure-copy">
              <h3>${tOrSetting("leisure.playTitle", state.settings.leisurePlayTitle)}</h3>
              <p>${tOrSetting("leisure.playText", state.settings.leisurePlayText)}</p>
            </div>
          </div>

          <div class="leisure-block reverse">
            <div class="leisure-media single">
              <img src="${mediaUrl(state.settings.leisureSpaImage)}" alt="Outdoor hot tub at sunset" loading="lazy" />
            </div>
            <div class="leisure-copy">
              <h3>${tOrSetting("leisure.spaTitle", state.settings.leisureSpaTitle)}</h3>
              <p>${tOrSetting("leisure.spaText", state.settings.leisureSpaText)}</p>
            </div>
          </div>
        </div>
      </section>
  `;
}
