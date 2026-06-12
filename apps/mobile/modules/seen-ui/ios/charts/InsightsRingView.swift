import ExpoModulesCore
import ExpoUI
import SwiftUI

public final class InsightsRingProps: UIBaseViewProps {
  @Field var progress: Double = 0
  @Field var colors: [Color] = []
  @Field var trackColor: Color?
  @Field var lineWidth: Double = 8
  @Field var animate: Bool = true
}

public struct InsightsRingView: ExpoSwiftUI.View {
  @ObservedObject public var props: InsightsRingProps
  @State private var shown: Double = 0

  public init(props: InsightsRingProps) {
    self.props = props
  }

  private var ringColors: [Color] {
    props.colors.isEmpty ? [.blue] : props.colors
  }

  private var gradient: AngularGradient {
    AngularGradient(
      colors: ringColors + [ringColors[0]],
      center: .center,
      startAngle: .degrees(0),
      endAngle: .degrees(360)
    )
  }

  public var body: some View {
    ZStack {
      Circle()
        .stroke(
          props.trackColor ?? ringColors[0].opacity(0.16),
          style: StrokeStyle(lineWidth: props.lineWidth, lineCap: .round)
        )
      Circle()
        .trim(from: 0, to: min(max(shown, 0), 1))
        .stroke(gradient, style: StrokeStyle(lineWidth: props.lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
    .padding(props.lineWidth / 2)
    .onAppear {
      if props.animate {
        withAnimation(.spring(response: 0.7, dampingFraction: 0.85)) {
          shown = props.progress
        }
      } else {
        shown = props.progress
      }
    }
    .onChange(of: props.progress) { newValue in
      if props.animate {
        withAnimation(.easeOut(duration: 0.35)) { shown = newValue }
      } else {
        shown = newValue
      }
    }
  }
}
