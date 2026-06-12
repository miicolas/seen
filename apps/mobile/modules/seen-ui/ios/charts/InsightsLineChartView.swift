import Charts
import ExpoModulesCore
import ExpoUI
import SwiftUI

struct InsightsChartPoint: Record {
  @Field var label: String = ""
  @Field var value: Double = 0
}

struct InsightsBandBound: Record {
  @Field var lower: Double = 0
  @Field var upper: Double = 0
}

public final class InsightsLineChartProps: UIBaseViewProps {
  @Field var points: [InsightsChartPoint] = []
  @Field var band: [InsightsBandBound] = []
  @Field var average: Double?
  @Field var averageLabel: String?
  @Field var accentColor: Color = .blue
  @Field var bandColor: Color?
  @Field var labelColor: Color?
  @Field var xLabelStride: Int = 1
  @Field var yAxisHidden: Bool = false
  @Field var xAxisHidden: Bool = false
  @Field var animate: Bool = true
  @Field var selectionEnabled: Bool = true
  var onSelectionChange = EventDispatcher()
}

public struct InsightsLineChartView: ExpoSwiftUI.View {
  @ObservedObject public var props: InsightsLineChartProps
  @State private var selectedIndex: Int? = nil

  public init(props: InsightsLineChartProps) {
    self.props = props
  }

  private var maxY: Double {
    var top = props.points.map(\.value).max() ?? 0
    if props.band.count == props.points.count {
      top = max(top, props.band.map(\.upper).max() ?? 0)
    }
    if let average = props.average { top = max(top, average) }
    return top > 0 ? top * 1.12 : 1
  }

  private var lineGradient: LinearGradient {
    LinearGradient(
      colors: [props.accentColor, props.accentColor.opacity(0.75)],
      startPoint: .top,
      endPoint: .bottom
    )
  }

  private var fillGradient: LinearGradient {
    LinearGradient(
      colors: [props.accentColor.opacity(0.28), props.accentColor.opacity(0.0)],
      startPoint: .top,
      endPoint: .bottom
    )
  }

  private func emit(_ index: Int?) {
    guard selectedIndex != index else { return }
    selectedIndex = index
    props.onSelectionChange(["index": index ?? -1])
  }

  private func handleDrag(at locationX: CGFloat, proxy: ChartProxy) {
    guard props.selectionEnabled, !props.points.isEmpty else { return }
    guard let raw: Double = proxy.value(atX: locationX) else { return }
    let index = min(max(Int(raw.rounded()), 0), props.points.count - 1)
    emit(index)
  }

  public var body: some View {
    Chart {
      if props.band.count == props.points.count {
        ForEach(Array(props.band.enumerated()), id: \.offset) { index, bound in
          AreaMark(
            x: .value("Index", index),
            yStart: .value("Lower", bound.lower),
            yEnd: .value("Upper", bound.upper),
            series: .value("Series", "band")
          )
          .interpolationMethod(.catmullRom)
          .foregroundStyle((props.bandColor ?? props.accentColor).opacity(0.14))
        }
      }

      ForEach(Array(props.points.enumerated()), id: \.offset) { index, point in
        AreaMark(
          x: .value("Index", index),
          y: .value("Value", point.value),
          series: .value("Series", "fill")
        )
        .interpolationMethod(.catmullRom)
        .foregroundStyle(fillGradient)

        LineMark(
          x: .value("Index", index),
          y: .value("Value", point.value),
          series: .value("Series", "line")
        )
        .interpolationMethod(.catmullRom)
        .foregroundStyle(lineGradient)
        .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
      }

      if let average = props.average {
        RuleMark(y: .value("Average", average))
          .foregroundStyle(props.accentColor.opacity(0.85))
          .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [3, 4]))
          .annotation(position: .top, alignment: .leading) {
            if let label = props.averageLabel {
              Text(label)
                .font(.caption2.weight(.bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Capsule().fill(props.accentColor))
            }
          }
      }

      if let selected = selectedIndex, selected < props.points.count {
        RuleMark(x: .value("Index", selected))
          .foregroundStyle((props.labelColor ?? props.accentColor).opacity(0.4))
          .lineStyle(StrokeStyle(lineWidth: 1))
        PointMark(
          x: .value("Index", selected),
          y: .value("Value", props.points[selected].value)
        )
        .symbolSize(120)
        .foregroundStyle(props.accentColor)
        PointMark(
          x: .value("Index", selected),
          y: .value("Value", props.points[selected].value)
        )
        .symbolSize(40)
        .foregroundStyle(.white)
      }
    }
    .chartYScale(domain: 0...maxY)
    .chartXScale(domain: -0.5...(Double(max(props.points.count - 1, 1)) + 0.5))
    .chartXAxis {
      if !props.xAxisHidden {
        AxisMarks(values: Array(stride(from: 0, to: props.points.count, by: max(props.xLabelStride, 1)))) { value in
          AxisValueLabel {
            if let index: Int = value.as(Int.self), index < props.points.count {
              Text(props.points[index].label)
                .font(.caption2)
                .foregroundStyle(props.labelColor ?? Color.secondary)
            }
          }
        }
      }
    }
    .chartYAxis {
      if !props.yAxisHidden {
        AxisMarks(position: .trailing) { _ in
          AxisGridLine().foregroundStyle(Color.secondary.opacity(0.12))
          AxisValueLabel()
            .font(.caption2)
            .foregroundStyle(props.labelColor ?? Color.secondary)
        }
      }
    }
    .chartOverlay { proxy in
      GeometryReader { geometry in
        Rectangle()
          .fill(Color.clear)
          .contentShape(Rectangle())
          .gesture(
            SpatialTapGesture()
              .onEnded { tap in
                let origin = geometry[proxy.plotAreaFrame].origin
                handleDrag(at: tap.location.x - origin.x, proxy: proxy)
              }
          )
          .simultaneousGesture(
            DragGesture(minimumDistance: 12)
              .onChanged { drag in
                let origin = geometry[proxy.plotAreaFrame].origin
                handleDrag(at: drag.location.x - origin.x, proxy: proxy)
              }
              .onEnded { _ in emit(nil) }
          )
      }
    }
    .animation(props.animate ? .easeOut(duration: 0.4) : nil, value: props.points.count)
  }
}
