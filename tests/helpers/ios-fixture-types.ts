/** Copies of frozen source constants are deliberately mutable in hostile-input tests. */
export type MutableFixture<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean
  : T extends readonly unknown[] ? { -readonly [Key in keyof T]: MutableFixture<T[Key]> }
  : T extends object ? { -readonly [Key in keyof T]: MutableFixture<T[Key]> } : T
export type BuiltinOverride = readonly [object, PropertyKey, unknown]
