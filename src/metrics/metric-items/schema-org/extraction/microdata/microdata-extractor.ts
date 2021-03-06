import * as cheerio from "cheerio";

import { valueAttrMappings } from "../prop-value.mappings";
import { MicrodataAttrs } from "./microdata-attrs.enum";
import { IMiccroDataScope } from "./microdata-scope.interface";

export class MicrodataExtractor {
  private attrMappings = valueAttrMappings;
  private $ = cheerio.load(this.content, { ignoreWhitespace: true });
  private scopesList = this.$("[itemscope][itemtype]");

  constructor(private content: string) {}

  public getMicrodata(): IMiccroDataScope[] {
    const schemas = this.scopesList.map((_i, scope) => ({
      "@type": this.getSchemaTypeName(scope),
      ...this.getPropValuesFromList(this.getScopePropertiesList(scope))
    }));
    return <IMiccroDataScope[]>(<unknown>schemas.toArray());
  }

  private getScopePropertiesList(scope: CheerioElement): CheerioElement[] {
    const propsSelector = "[itemprop]:not(:scope [itemscope] [itemprop]):not([itemscope])";
    return Array.from(this.$(scope).find(propsSelector));
  }

  private getSchemaTypeName(scope: CheerioElement): string {
    const namespace = this.$(scope).attr(MicrodataAttrs.type);
    return namespace.replace(new RegExp("https?://schema.org/"), "");
  }

  private getPropValuesFromList(propsList: CheerioElement[]): {} {
    return propsList.reduce(
      (obj, prop) => ({
        ...obj,
        [prop.attribs[MicrodataAttrs.prop]]: this.getPropValue(prop)
      }),
      {}
    );
  }

  private getPropValue(prop: CheerioElement): string {
    const valueAttr = this.attrMappings.find(mapping => mapping.tags.includes(prop.name));
    return valueAttr ? this.$(prop).attr(valueAttr.attr) : this.$(prop).text();
  }
}
