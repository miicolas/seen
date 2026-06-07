import ExpoModulesCore
import SwiftUI

internal enum SymbolReplaceFallback: String, Enumerable {
  case downUp
  case offUp
  case upUp
}

internal enum SymbolReplaceScope: String, Enumerable {
  case byLayer
  case wholeSymbol
}

internal struct SymbolReplaceTransitionModifier: ViewModifier, Record {
  @Field var fallback: SymbolReplaceFallback = .downUp
  @Field var scope: SymbolReplaceScope = .wholeSymbol
  @Field var nonRepeating: Bool = true

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 18.0, tvOS 18.0, *) {
      content.contentTransition(
        .symbolEffect(.replace.magic(fallback: fallbackEffect), options: options)
      )
    } else if #available(iOS 17.0, tvOS 17.0, *) {
      content.contentTransition(.symbolEffect)
    } else {
      content
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private var options: SymbolEffectOptions {
    nonRepeating ? .nonRepeating : .default
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private var fallbackEffect: ReplaceSymbolEffect {
    let effect: ReplaceSymbolEffect = switch fallback {
    case .downUp:
      .downUp
    case .offUp:
      .offUp
    case .upUp:
      .upUp
    }

    return switch scope {
    case .byLayer:
      effect.byLayer
    case .wholeSymbol:
      effect.wholeSymbol
    }
  }
}
