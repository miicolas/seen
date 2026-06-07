import ExpoModulesCore
import ExpoUI

public class SeenUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SeenUI")

    OnCreate {
      ViewModifierRegistry.register("seenSymbolReplaceTransition") { params, appContext, _ in
        return try SymbolReplaceTransitionModifier(from: params, appContext: appContext)
      }
    }

    OnDestroy {
      ViewModifierRegistry.unregister("seenSymbolReplaceTransition")
    }
  }
}
