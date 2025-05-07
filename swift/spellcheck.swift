import Foundation
import AppKit

let args = CommandLine.arguments
guard args.count > 1 else {
    print("Please provide a word to check.")
    exit(1)
}

let word = args[1]
let range = NSRange(location: 0, length: word.utf16.count)

let spellChecker = NSSpellChecker.shared
let misspelledRange = spellChecker.checkSpelling(of: word, startingAt: 0)

if misspelledRange.location == NSNotFound {
    // print("'\(word)' is spelled correctly.")
    exit(0)
    
}

let correction = spellChecker.correction(forWordRange: range,
                                         in: word,
                                         language: "en",
                                         inSpellDocumentWithTag: 0)
print("\(word) ---> \(correction)")
exit(1)
