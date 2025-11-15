import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BRAND_COLORS } from "../../theme/colors";

const DropdownSelect = ({
  label,
  value,
  placeholder = "Select an option",
  options = [],
  onSelect,
  disabled = false,
  helperText,
}) => {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.value === value) || null;
  const displayValue = selectedOption?.label || value;

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (option) => {
    setOpen(false);
    onSelect?.(option.value, option);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.button,
          open && styles.buttonOpen,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            !displayValue && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {displayValue || placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
      {open && (
        <View style={styles.dropdown}>
          <ScrollView contentContainerStyle={styles.dropdownContent}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.option}
                onPress={() => handleSelect(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  label: {
    color: BRAND_COLORS.text,
    fontWeight: "600",
  },
  button: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonOpen: {
    borderColor: BRAND_COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: BRAND_COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: BRAND_COLORS.muted,
  },
  chevron: {
    color: BRAND_COLORS.muted,
    fontSize: 14,
  },
  dropdown: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(15, 14, 25, 0.98)",
    maxHeight: 220,
    overflow: "hidden",
  },
  dropdownContent: {
    paddingVertical: 6,
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  optionText: {
    color: BRAND_COLORS.text,
    fontSize: 15,
  },
  optionTextActive: {
    color: BRAND_COLORS.primary,
    fontWeight: "600",
  },
  helperText: {
    color: BRAND_COLORS.muted,
    fontSize: 13,
  },
});

export default DropdownSelect;
