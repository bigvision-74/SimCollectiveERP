// export const isValidInput = (value: string) => {
//     const invalidCharactersPattern = /[<>\/\\]|<script.*?>.*?<\/script>/i;
//     return !invalidCharactersPattern.test(value);
//   };

export const isValidInput = (value: string) => {
  const invalidCharactersPattern = /[<>\\]|<script.*?>.*?<\/script>/i;
  return value.trim() !== '' && !invalidCharactersPattern.test(value);
};
