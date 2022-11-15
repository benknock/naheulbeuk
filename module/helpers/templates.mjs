/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([

    // Actor partials.
    "systems/naheulbeuk/templates/actor/parts/actor-competences.html",
    "systems/naheulbeuk/templates/actor/parts/actor-coupsspeciaux.html",
    "systems/naheulbeuk/templates/actor/parts/actor-items.html",
    "systems/naheulbeuk/templates/actor/parts/actor-spells.html",
    "systems/naheulbeuk/templates/actor/parts/actor-effects.html",
    "systems/naheulbeuk/templates/actor/parts/actor-ape.html",
  ]);
};
